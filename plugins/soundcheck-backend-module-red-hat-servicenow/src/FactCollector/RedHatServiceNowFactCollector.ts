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
import {
  COLLECTOR_ID,
  SERVICE_FACT_REFERENCE,
  PIA_STATE_FACT_REFERENCE,
  SIA_STATE_FACT_REFERENCE,
} from '../lib/constants';
import {
  ServiceNowClient,
  CMDBMeta,
  readServiceNowIntegrationConfigs,
  ServiceNowComplianceControlItem,
} from '@compass/backstage-plugin-service-now-common';
import { JsonObject } from '@backstage/types';

/**
 * Fact collector for facts fetched from ServiceNow API.
 */
export class RedHatServiceNowFactCollector implements FactCollector {
  /** @inheritdoc */
  id: string = COLLECTOR_ID;

  /** @inheritdoc */
  name: string = 'Red Hat Service Now';

  /** @inheritdoc */
  description: string = 'Collects data from Service Now.';

  protected readonly annotationAppCmdbCode: string = 'servicenow.com/appcode';
  protected cache: CacheService;
  protected logger: LoggerService;
  protected config: Config;
  protected collectorConfig: Config;

  protected constructor(
    cache: CacheService,
    config: RootConfigService,
    logger: LoggerService,
  ) {
    this.cache = cache;
    this.config = config;
    this.logger = logger.child({
      target: COLLECTOR_ID,
    });

    const collectorConfig = this.config.getOptionalConfig(
      'soundcheck.collectors.redHatServiceNow',
    );
    if (!collectorConfig) {
      throw new Error(
        'Missing config at soundcheck.collectors.redHatServiceNow',
      );
    }
    this.collectorConfig = collectorConfig;
  }

  public static create(
    cache: CacheService,
    config: RootConfigService,
    logger: LoggerService,
  ): RedHatServiceNowFactCollector {
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
    const allowedRefs = [
      stringifyFactRef(SERVICE_FACT_REFERENCE),
      stringifyFactRef(PIA_STATE_FACT_REFERENCE),
      stringifyFactRef(SIA_STATE_FACT_REFERENCE),
    ];

    if (params?.factRefs) {
      if (
        !params.factRefs.some(ref =>
          allowedRefs.includes(stringifyFactRef(ref)),
        )
      ) {
        this.logger.warn(
          `Unsupported factRefs requested in RedHatServiceNowFactCollector: ${JSON.stringify(
            params.factRefs,
          )}`,
        );
        return [];
      }
    }
    // TODO: Look into how this works.
    if (params?.refresh) {
      this.logger.warn('Refresh is not supported for this collector');
    }

    // TODO: Since this is a config array, determine which one to use.
    const serviceNowConfigs = readServiceNowIntegrationConfigs(this.config);
    const serviceNowClient = new ServiceNowClient({
      config: serviceNowConfigs[0],
      logger: this.logger,
    });

    for (const entity of entities) {
      const cmdbRecordId =
        entity.metadata?.annotations?.['servicenow.com/appcode'];
      if (!cmdbRecordId) {
        this.logger.warn(
          `Entity ${entity.metadata.name} is missing a servicenow.com/appcode annotation`,
        );
        continue;
      }

      const cmdb = entity.metadata?.cmdb as CMDBMeta | undefined;
      const cmdbSysId = cmdb?.sysId;
      if (!cmdbSysId) {
        this.logger.warn(
          `Entity ${entity.metadata.name} is missing the servicenow sysId.`,
        );
        continue;
      }

      const options = {
        'profile.cmdb_ci': cmdbSysId,
        '^state!': 'retired',
        ORDERBYnumber: true,
      };

      const resp = await serviceNowClient.getComplianceControls('', options);

      if (!resp || !resp.items || !Array.isArray(resp.items)) {
        this.logger.error(
          `Invalid response from ServiceNow for entity ${entity.metadata.namespace}/${entity.metadata.name}`,
        );
        continue;
      }

      const invalidItems = resp.items.filter(
        item => !this.isValidComplianceControlItem(item),
      );
      if (invalidItems.length > 0) {
        this.logger.error(
          `Invalid structure for ${invalidItems.length} items in the ServiceNow response.`,
        );
        continue;
      }

      const piaData = await serviceNowClient.getComplianceControlsByTriggerId(
        cmdbSysId,
      );
      if (!piaData || !piaData.items || !Array.isArray(piaData.items)) {
        this.logger.error(
          `Invalid response from ServiceNow for entity ${entity.metadata.namespace}/${entity.metadata.name}`,
        );
        continue;
      }

      const piaResponseState = piaData.items.map(item => item?.state);

      const siaData = await serviceNowClient.getSIAComplianceControlsBySysId(
        cmdbSysId,
      );
      if (!siaData || !siaData.items || !Array.isArray(siaData.items)) {
        this.logger.error(
          `Invalid response from ServiceNow for SIA compliance controls for entity ${entity.metadata.namespace}/${entity.metadata.name}`,
        );
        continue;
      }
      const now = Date.now();

      const siaResponse = siaData.items.map(item => ({
        ...item,
        expiresCount: Math.ceil(
          (new Date(item.expires).getTime() - now) / 86400000,
        ),
      }));

      facts.push({
        factRef: PIA_STATE_FACT_REFERENCE,
        entityRef: stringifyEntityRef(entity),
        data: { pia_state: piaResponseState } as JsonObject,
        timestamp: new Date().toISOString(),
      });

      facts.push({
        factRef: SIA_STATE_FACT_REFERENCE,
        entityRef: stringifyEntityRef(entity),
        data: { sia_state: siaResponse } as unknown as JsonObject,
        timestamp: new Date().toISOString(),
      });

      facts.push({
        factRef: SERVICE_FACT_REFERENCE,
        entityRef: stringifyEntityRef(entity),
        data: {
          controls: resp.items as unknown as JsonObject,
        },
        timestamp: new Date().toISOString(),
      });
    }

    return facts;
  }

  /** @inheritdoc */
  async getFactNames(): Promise<string[]> {
    return [
      SERVICE_FACT_REFERENCE,
      PIA_STATE_FACT_REFERENCE,
      SIA_STATE_FACT_REFERENCE,
    ];
  }

  /** @inheritdoc */
  async getDataSchema(factName: FactRef): Promise<string | undefined> {
    switch (stringifyFactRef(factName)) {
      case SERVICE_FACT_REFERENCE.split('/')[1]:
        return JSON.stringify({
          title: 'ESS Compliance Controls',
          description:
            'Enterprise Security Standards (ESS) compliance controls.',
          type: 'object',
          properties: {
            controls: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  state: { type: 'string' },
                  status: { type: 'string' },
                  frequency: { type: 'string' },
                  sys_created_on: { type: 'string', format: 'date-time' },
                  sys_updated_on: { type: 'string', format: 'date-time' },
                },
                required: [
                  'name',
                  'state',
                  'status',
                  'frequency',
                  'sys_created_on',
                  'sys_updated_on',
                ],
              },
            },
          },
        });

      case PIA_STATE_FACT_REFERENCE.split('/')[1]:
        return JSON.stringify({
          title: 'PIA State',
          type: 'object',
          properties: {
            pia_state: {
              type: 'array',
              items: { type: 'string' },
            },
          },
          required: ['pia_state'],
        });
      case SIA_STATE_FACT_REFERENCE.split('/')[1]:
        return JSON.stringify({
          title: 'SIA State',
          type: 'object',
          properties: {
            sia_state: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  state: { type: 'string' },
                  expires: { type: 'string' },
                  sys_created_on: { type: 'string', format: 'date-time' },
                  sys_updated_on: { type: 'string', format: 'date-time' },
                },
                required: [
                  'name',
                  'state',
                  'expires',
                  'sys_created_on',
                  'sys_updated_on',
                ],
              },
            },
          },
          required: ['sia_state'],
        });

      default:
        return undefined;
    }
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
        factRefs: [
          SERVICE_FACT_REFERENCE,
          PIA_STATE_FACT_REFERENCE,
          SIA_STATE_FACT_REFERENCE,
        ],
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

  // Type guard to validate each item.
  private isValidComplianceControlItem(
    item: any,
  ): item is ServiceNowComplianceControlItem {
    return (
      typeof item.sys_created_on === 'string' &&
      typeof item.name === 'string' &&
      typeof item.sys_updated_on === 'string' &&
      typeof item.state === 'string' &&
      typeof item.frequency === 'string' &&
      typeof item.status === 'string'
    );
  }
}
