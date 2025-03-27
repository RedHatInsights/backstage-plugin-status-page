import { Knex } from 'knex';
import { resolvePackagePath } from '@backstage/backend-plugin-api';
import { SubgraphData, SubgraphDataModel } from '../types';

const migrationsDir = resolvePackagePath(
  '@appdev-platform/backstage-plugin-devex-data-layer-backend',
  'migrations',
);

export interface DataLayerBackendStore {
  insertSearchData(data: SubgraphData): Promise<SubgraphData>;
  getSearchDataBySubgraph(subgraph: string): Promise<SubgraphData | null>;
  updateSearchDataBySubgraph(data: SubgraphData): Promise<SubgraphData | null>;
}

export class DataLayerBackendDatabase implements DataLayerBackendDatabase {
  private readonly DATA_LAYER_TABLE = 'datalayer';
  static async create(options: {
    knex: Knex;
    skipMigrations: boolean;
  }): Promise<DataLayerBackendStore> {
    const database = options.knex;

    if (!options.skipMigrations)
      await database.migrate.latest({
        directory: migrationsDir,
      });

    return new DataLayerBackendDatabase(database);
  }

  constructor(private readonly db: Knex) {}

  async insertSearchData(data: SubgraphData): Promise<SubgraphData> {
    const [dbResult] = await this.db<SubgraphDataModel>(
      this.DATA_LAYER_TABLE,
    ).insert(
      {
        ...this.mapSubgraphDataToDatabaseModel({ ...data }),
        last_updated_on: this.db.fn.now(),
      },
      '*',
    );
    return this.mapDatabaseModelToSubgraphData(dbResult);
  }
  async getSearchDataBySubgraph(
    subgraph: string,
  ): Promise<SubgraphData | null> {
    const dbResult = await this.db<SubgraphDataModel>(this.DATA_LAYER_TABLE)
      .where('subgraph', subgraph)
      .first();
    return dbResult ? this.mapDatabaseModelToSubgraphData(dbResult) : null;
  }

  async updateSearchDataBySubgraph(
    data: SubgraphData,
  ): Promise<SubgraphData | null> {
    const [dbResult] = await this.db<SubgraphDataModel>(this.DATA_LAYER_TABLE)
      .select('*')
      .where('subgraph', data.subgraph)
      .update(
        {
          ...this.mapSubgraphDataToDatabaseModel(data),
          last_updated_on: this.db.fn.now(),
        },
        '*',
      );
    return this.mapDatabaseModelToSubgraphData(dbResult) || null;
  }

  private mapSubgraphDataToDatabaseModel(
    data: SubgraphData,
  ): SubgraphDataModel {
    return {
      subgraph: data.subgraph,
      search_data: data.searchData,
    };
  }

  private mapDatabaseModelToSubgraphData(
    data: SubgraphDataModel,
  ): SubgraphData {
    return {
      subgraph: data.subgraph,
      searchData: data.search_data,
      lastUpdatedOn: data.last_updated_on,
    };
  }
}
