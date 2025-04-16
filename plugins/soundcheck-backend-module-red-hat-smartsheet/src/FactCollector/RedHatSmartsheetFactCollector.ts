'use strict';

import { Entity, stringifyEntityRef } from '@backstage/catalog-model';
import { FactCollector } from '@spotify/backstage-plugin-soundcheck-node';
import {
  CacheService,
  LoggerService,
  RootConfigService,
} from '@backstage/backend-plugin-api';
import { Config } from '@backstage/config';
import {
  CollectionConfig,
  CollectionError,
  Fact,
  FactRef,
  stringifyFactRef,
} from '@spotify/backstage-plugin-soundcheck-common';
import { JsonValue } from '@backstage/types';
import { createClient } from 'smartsheet';
import { COLLECTOR_ID, SERVICE_FACT_REFERENCE } from '../lib/constants';
import { SmartsheetData } from '../lib/types';

/**
 * Fact collector for facts fetched from Smartsheet API.
 */
export class RedHatSmartsheetFactCollector implements FactCollector {
  /** @inheritdoc */
  id: string = COLLECTOR_ID;

  /** @inheritdoc */
  name: string = 'Red Hat Smartsheet';

  /** @inheritdoc */
  description: string = 'Collects data from Smartsheet.';

  /**
   * CMDB app code annotation ID.
   *
   * @type {string}
   *
   * @protected
   *
   * @readonly
   */
  protected readonly annotationAppCmdbCode: string = 'servicenow.com/appcode';

  /**
   * Cache service.
   *
   * @type {CacheService}
   *
   * @protected
   */
  protected cache: CacheService;

  /**
   * Config service.
   *
   * @type {RootConfigService}
   *
   * @private
   */
  config?: RootConfigService;

  /**
   * Logger service.
   *
   * @type {LoggerService}
   *
   * @protected
   */
  protected logger: LoggerService;

  /**
   * Smartsheet configuration.
   *
   * @type {Config[]}
   *
   * @protected
   */
  protected collectorConfig: Config;

  /**
   * Constructor.
   *
   * @param {CacheService} cache
   *   Cache service.
   * @param {RootConfigService} config
   *   Config service.
   * @param {LoggerService} logger
   *   Logger service.
   *
   * @protected
   */
  protected constructor(
    cache: CacheService,
    config: RootConfigService,
    logger: LoggerService,
  ) {
    this.cache = cache;
    this.config = config;
    this.logger = logger.child({
      target: 'Red Hat Smartsheet FactCollector',
    });

    const collectorConfig = this.config.getOptionalConfig(
      'soundcheck.collectors.redHatSmartsheet',
    );
    if (!collectorConfig) {
      throw new Error(
        'Missing config at soundcheck.collectors.redHatSmartsheet',
      );
    }
    this.collectorConfig = collectorConfig;
  }

  /**
   * Static factory method.
   *
   * @param {CacheService} cache
   *   Cache service.
   * @param {RootConfigService} config
   *   Root configuration service.
   * @param {LoggerService} logger
   *   Logger service.
   *
   * @return {RedHatCoreFactCollector}
   *   Instance of this class.
   */
  public static create(
    cache: CacheService,
    config: RootConfigService,
    logger: LoggerService,
  ): RedHatSmartsheetFactCollector {
    return new this(cache, config, logger);
  }

  /** @inheritdoc */
  async collect(
    entities: Entity[],
    params?: {
      factRefs?: FactRef[];
      refresh?: FactRef[];
    },
  ): Promise<(Fact | CollectionError)[]> {
    const facts: Fact[] = [];

    if (params?.factRefs) {
      if (
        !params.factRefs.find(
          value => stringifyFactRef(value) === SERVICE_FACT_REFERENCE,
        )
      ) {
        this.logger.warn(
          `Unsupported factRefs requested in RedHatSmartsheetFactCollector: ${JSON.stringify(
            params.factRefs,
          )}`,
        );
        return [];
      }
    }

    // TODO: Check how refresh works on fact collectors.
    if (params?.refresh) {
      this.logger.warn('Refresh is not supported for this collector');
    }

    const cacheKey = 'smartsheet-data';
    let smartsheetData = (await this.cache.get(
      cacheKey,
    )) as SmartsheetData | null;

    // TODO: Fix cast as unknown.
    if (!smartsheetData) {
      smartsheetData = (await this.fetchSmartsheetData()) || {
        columns: [],
        rows: [],
      };
      await this.cache.set(cacheKey, smartsheetData as unknown as JsonValue, {
        ttl: { minutes: 15 },
      });
    }

    // Find the CMDB Record & PIA status column IDs once.
    const cmdbRecordColumnId = smartsheetData?.columns.find(
      column => column.title === 'CMDB Record ID',
    )?.id;
    if (!cmdbRecordColumnId) {
      throw new Error(
        'Cannot find CMDB Record ID column in the spreadsheet; Check Smartsheet.',
      );
    }
    const piaStatusColumnId = smartsheetData?.columns.find(
      column => column.title === 'PIA Status',
    )?.id;
    if (!piaStatusColumnId) {
      throw new Error(
        'Cannot find PIA Status column in the spreadsheet; Check Smartsheet.',
      );
    }

    for (const entity of entities) {
      const cmdbRecordId =
        entity.metadata?.annotations?.['servicenow.com/appcode'];
      if (!cmdbRecordId) {
        this.logger.warn(
          `Entity ${entity.metadata.name} is missing a servicenow.com/appcode annotation`,
        );
        continue;
      }

      const matchedStatus = this.findPIAStatus(
        cmdbRecordId,
        cmdbRecordColumnId,
        piaStatusColumnId,
        smartsheetData,
      );
      if (matchedStatus) {
        facts.push({
          factRef: SERVICE_FACT_REFERENCE,
          entityRef: stringifyEntityRef(entity),
          data: { status: matchedStatus },
          timestamp: new Date().toISOString(),
        });
      }
    }

    return facts;
  }

  /**
   * Fetches entire smartsheet for the provided sheet id in collector config.
   */
  async fetchSmartsheetData(): Promise<SmartsheetData | null> {
    const token = this.collectorConfig?.getString('api_token');
    const sheetId = this.collectorConfig?.getString('sheetId');

    const smartsheetClient = createClient({
      accessToken: token,
      logLevel: 'debug',
    });

    try {
      return await smartsheetClient.sheets.getSheet({ id: sheetId });
    } catch (error: any) {
      this.logger.error('Error fetching Smartsheet data.', error);
      return null;
    }
  }

  /**
   * Returns the PIA status for the CMDB record id matching the servicenow annotation.
   */
  private findPIAStatus(
    cmdbRecordId: string,
    cmdbRecordColumnId: number,
    statusColumnId: number,
    smartsheetData: SmartsheetData,
  ): string {
    const matchingRow = smartsheetData.rows.find(row => {
      return (
        row.cells.find(cell => cell.columnId === cmdbRecordColumnId)
          ?.displayValue === cmdbRecordId
      );
    });

    const statusCell = matchingRow?.cells.find(
      cell => cell.columnId === statusColumnId,
    );

    return statusCell?.displayValue || 'Empty';
  }

  /** @inheritdoc */
  async getFactNames(): Promise<string[]> {
    return [SERVICE_FACT_REFERENCE];
  }

  /** @inheritdoc */
  async getDataSchema(factName: FactRef): Promise<string | undefined> {
    if (factName === SERVICE_FACT_REFERENCE.split('/')[1]) {
      return JSON.stringify({
        title: 'PIA Status',
        description: 'Privacy Impact Analysis status sourced from Smartsheet.',
        type: 'object',
        properties: {
          status: {
            type: 'string',
          },
        },
      });
    }
    return undefined;
  }

  /** @inheritdoc */
  async getCollectionConfigs(): Promise<CollectionConfig[]> {
    // Nothing to collect if we don't have a config or if there are no collects configured.
    // const collects = this.#config?.getConfigArray('collects');
    const collects = this.collectorConfig?.getConfigArray('collects');

    if (!collects || collects?.length === 0) {
      return [];
    }

    // Use any defaults in the configuration for this collector to apply to all Collect configurations:
    return collects.map((collect: Config) => {
      const collectionConfig = collect;
      return {
        // Update this if we support more than 1 collection of facts.
        factRefs: [SERVICE_FACT_REFERENCE],
        filter:
          collectionConfig.getOptional('filter') ??
          this.config?.getOptional('filter') ??
          undefined,
        exclude:
          collectionConfig.getOptional('exclude') ??
          this.config?.getOptional('exclude') ??
          undefined,
        frequency:
          collectionConfig.getOptional('frequency') ??
          this.config?.getOptional('frequency') ??
          undefined,
        initialDelay:
          collectionConfig.getOptional('initialDelay') ??
          this.config?.getOptional('initialDelay') ??
          undefined,
        batchSize:
          collectionConfig.getOptional('batchSize') ??
          this.config?.getOptional('batchSize') ??
          undefined,
        cache:
          collectionConfig.getOptional('cache') ??
          this.config?.getOptional('cache') ??
          undefined,
      };
    });
  }
}
