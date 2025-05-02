import { Knex } from 'knex';
import { resolvePackagePath } from '@backstage/backend-plugin-api';
import { GatewayRequest, GatewayRequestModel } from '../types/database';

const migrationsDir = resolvePackagePath(
  '@appdev-platform/backstage-plugin-devex-data-layer-backend',
  'migrations',
);

export interface HydraSplunkStore {
  insertSearchData(data: GatewayRequest): Promise<GatewayRequest>;
  getSearchDataByLogId(lodId: string): Promise<GatewayRequest | null>;
  updateSearchDataByLogId(data: GatewayRequest): Promise<GatewayRequest | null>;
}

export class HydraSplunkDatabase implements HydraSplunkStore {
  private readonly HYDRA_TABLE = 'hydra';

  static async create(options: {
    knex: Knex;
    skipMigrations: boolean;
  }): Promise<HydraSplunkStore> {
    const database = options.knex;

    if (!options.skipMigrations)
      await database.migrate.latest({
        directory: migrationsDir,
      });

    return new HydraSplunkDatabase(database);
  }

  constructor(private readonly db: Knex) {}

  async insertSearchData(data: GatewayRequest): Promise<GatewayRequest> {
    const [dbResult] = await this.db<GatewayRequestModel>(
      this.HYDRA_TABLE,
    ).insert(
      {
        ...this.mapDataToModel({ ...data }),
        last_updated_on: this.db.fn.now(),
      },
      '*',
    );
    return this.mapModelToData(dbResult);
  }
  async getSearchDataByLogId(logId: string): Promise<GatewayRequest | null> {
    const dbResult = await this.db<GatewayRequestModel>(this.HYDRA_TABLE)
      .where('log_id', logId)
      .first();
    return dbResult ? this.mapModelToData(dbResult) : null;
  }

  async updateSearchDataByLogId(
    data: GatewayRequest,
  ): Promise<GatewayRequest | null> {
    const [dbResult] = await this.db<GatewayRequestModel>(this.HYDRA_TABLE)
      .select('*')
      .where('log_id', data.logId)
      .update(
        {
          ...this.mapDataToModel(data),
          last_updated_on: this.db.fn.now(),
        },
        '*',
      );
    return this.mapModelToData(dbResult) || null;
  }

  private mapDataToModel(data: GatewayRequest): GatewayRequestModel {
    return {
      log_id: data.logId,
      search_data: data.searchData,
    };
  }

  private mapModelToData(data: GatewayRequestModel): GatewayRequest {
    return {
      searchData: data.search_data,
      lastUpdatedOn: data.last_updated_on,
    };
  }
}
