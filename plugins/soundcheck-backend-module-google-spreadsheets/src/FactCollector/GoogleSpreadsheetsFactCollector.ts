import { CacheService, LoggerService } from '@backstage/backend-plugin-api';
import { Entity, stringifyEntityRef } from '@backstage/catalog-model';
import { Config } from '@backstage/config';
import {
  CollectionConfig,
  CollectionError,
  CompoundFactRef,
  Fact,
  FactRef,
  parseFactRef,
  stringifyFactRef,
} from '@spotify/backstage-plugin-soundcheck-common';
import { FactCollector } from '@spotify/backstage-plugin-soundcheck-node';
import { DateTime } from 'luxon';
import { google, sheets_v4 } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import QEScorecadSchema from '../schemas/QEScorecard.schema.json';
import { getScorecardsByAppcodes } from '../utils/getScorcardsByAppcodes';
import {
  COLLECTOR_ID,
  GOOGLE_API_SCOPES,
  QE_FACT_REFERENCE,
  SCOPE,
} from '../constants';

export class GoogleSpreadsheetsFactCollector implements FactCollector {
  id: string = 'google-spreadsheets';
  name: string = 'Google Spreadsheets';
  description: string = 'Collect facts from google spreadsheets';

  protected sheetsApiService: sheets_v4.Sheets;

  constructor(
    private readonly collectorConfig: Config,
    private readonly logger: LoggerService,
    private readonly cache: CacheService,
  ) {
    const client = new GoogleAuth({
      credentials: JSON.parse(collectorConfig.getString('googleCredentials')),
      scopes: GOOGLE_API_SCOPES,
    });
    this.sheetsApiService = google.sheets({ version: 'v4', auth: client });
  }

  public static create(
    cache: CacheService,
    collectorConfig: Config,
    logger: LoggerService,
  ): GoogleSpreadsheetsFactCollector {
    return new GoogleSpreadsheetsFactCollector(
      collectorConfig,
      logger.child({ target: COLLECTOR_ID }),
      cache.withOptions({ defaultTtl: { minutes: 5 } }),
    );
  }

  async collect(
    entities: Entity[],
    params?: { factRefs?: FactRef[]; refresh?: FactRef[] },
  ): Promise<(Fact | CollectionError)[]> {
    const facts: Fact[] = [];
    const allowedRefs = [stringifyFactRef(QE_FACT_REFERENCE)];

    if (params?.factRefs) {
      if (
        !params.factRefs.some(ref =>
          allowedRefs.includes(stringifyFactRef(ref)),
        )
      ) {
        this.logger.warn(
          `Unsupported factRefs requested in ${COLLECTOR_ID}: ${JSON.stringify(
            params.factRefs,
          )}`,
        );
        return [];
      }
    }

    if (params?.refresh && params.refresh.length > 0) {
      for (const entity of entities) {
        for (const factRef of params.refresh) {
          let fact: Fact | undefined = undefined;
          const parsedFactRef = parseFactRef(factRef);
          switch (parsedFactRef.name) {
            case 'qe_scorecard':
              fact = await this.getQEspreadsheetData(
                entity,
                parsedFactRef,
                true,
              );
              break;
            default:
            //
          }
          if (fact !== undefined) facts.push(fact);
        }
      }
      return facts;
    }

    for (const entity of entities) {
      for (const factRef of params?.factRefs ?? []) {
        let fact: Fact | undefined = undefined;
        const parsedFactRef = parseFactRef(factRef);
        switch (parsedFactRef.name) {
          case 'qe_scorecard':
            fact = await this.getQEspreadsheetData(entity, parsedFactRef);
            break;
          default:
          //
        }
        if (fact !== undefined) facts.push(fact);
      }
    }
    return facts;
  }

  private getCollectionConfig(parsedFactRef: CompoundFactRef) {
    const config = this.collectorConfig
      .getOptionalConfigArray('collects')
      ?.find(p => p.getOptionalString('type') === parsedFactRef.name);

    return config;
  }

  async getQEspreadsheetData(
    entity: Entity,
    parsedFactRef: CompoundFactRef,
    forceRefresh: boolean = false,
  ): Promise<Fact | undefined> {
    const config = this.getCollectionConfig(parsedFactRef);
    if (!config) return undefined;

    const googleSpreadsheetId = config.getString('spreadsheetId');
    const range = config.getString('range');

    try {
      if (!forceRefresh) {
        const factsCachedData = await this.cache.get<string[][]>(
          `soundcheck.${this.id}.${parsedFactRef.name}`,
        );

        if (factsCachedData) {
          this.logger.info('fetching from cached data');
          const data = getScorecardsByAppcodes(factsCachedData, entity);
          if (data) {
            return {
              factRef: stringifyFactRef(parsedFactRef),
              entityRef: stringifyEntityRef(entity),
              data,
              timestamp: DateTime.utc().toISO(),
            };
          }
        }
      }

      // If refersh is triggered from frontend or cache is empty
      this.logger.info('fetching from google spreadsheet');
      const response = await this.sheetsApiService.spreadsheets.values.get({
        spreadsheetId: googleSpreadsheetId,
        range: range,
      });

      if (!response.data.values) return undefined;

      await this.cache.set(
        `soundcheck.${this.id}.${parsedFactRef.name}`,
        response.data.values,
      );
      const data = getScorecardsByAppcodes(response.data.values, entity);
      if (data) {
        return {
          factRef: stringifyFactRef(parsedFactRef),
          entityRef: stringifyEntityRef(entity),
          data,
          timestamp: DateTime.utc().toISO(),
        };
      }
    } catch (err: any) {
      this.logger.error('Failed to fetch from spreadsheet, error: ', {
        ...err,
      });
    }

    return undefined;
  }

  async getFactNames(): Promise<string[]> {
    return [QE_FACT_REFERENCE];
  }

  async getDataSchema(factRef: FactRef): Promise<string | undefined> {
    switch (factRef) {
      case 'qe_scorecard': {
        const configFactSchema = this.getCollectionConfig(
          parseFactRef(factRef, {
            defaultSource: COLLECTOR_ID,
            defaultScope: SCOPE,
          }),
        )?.getOptional('factSchema');
        return configFactSchema
          ? JSON.stringify(configFactSchema)
          : JSON.stringify(QEScorecadSchema);
      }
      default:
        break;
    }
    return undefined;
  }

  async getCollectionConfigs(): Promise<CollectionConfig[]> {
    const collects = this.collectorConfig.getConfigArray('collects');
    if (
      this.collectorConfig === undefined ||
      !collects ||
      collects?.length === 0
    ) {
      return [];
    }
    const factNames = await this.getFactNames();

    return collects.map((collect: Config) => {
      return {
        factRefs: factNames, // We only support one fact.
        filter:
          collect.getOptional('filter') ??
          this.collectorConfig.getOptional('filter') ??
          undefined,
        exclude:
          collect.getOptional('exclude') ??
          this.collectorConfig.getOptional('exclude') ??
          undefined,
        frequency:
          collect.getOptional('frequency') ??
          this.collectorConfig.getOptional('frequency') ??
          undefined,
        initialDelay:
          collect.getOptional('initialDelay') ??
          this.collectorConfig.getOptional('initialDelay') ??
          undefined,
        batchSize:
          collect.getOptional('batchSize') ??
          this.collectorConfig.getOptional('batchSize') ??
          undefined,
        cache:
          collect.getOptional('cache') ??
          this.collectorConfig.getOptional('cache') ??
          undefined,
      };
    });
  }
}
