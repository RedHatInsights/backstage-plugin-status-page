import { Knex } from 'knex';
import { resolvePackagePath } from '@backstage/backend-plugin-api';
import { Subgraph, SubgraphData, SubgraphDataModel } from '../types';
import { SubgraphModel } from '../types/database';

const migrationsDir = resolvePackagePath(
  '@appdev-platform/backstage-plugin-devex-data-layer-backend',
  'migrations',
);

export interface DataLayerBackendStore {
  insertSearchData(data: SubgraphData): Promise<SubgraphData>;
  getSearchDataBySubgraph(subgraph: string): Promise<SubgraphData | null>;
  updateSearchDataBySubgraph(data: SubgraphData): Promise<SubgraphData | null>;
  insertSubgraphs(data: Subgraph): Promise<Subgraph | null>;
  getSubgraphsData(): Promise<Subgraph | null>;
  updateSubgraphsData(data: Subgraph): Promise<Subgraph | null>;
}

export class DataLayerBackendDatabase implements DataLayerBackendDatabase {
  private readonly DATA_LAYER_TABLE = 'datalayer';
  private readonly SUBGRAPH_TABLE = 'subgraphs';
  private readonly SINGLE_SEARCH_ID = 'subgraph_search__id';

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

  async insertSubgraphs(data: Subgraph): Promise<Subgraph | null> {
    const [dbResult] = await this.db<SubgraphModel>(this.SUBGRAPH_TABLE).insert(
      {
        search_id: 'subgraph_search__id',
        ...this.mapSubgraphToModel(data),
        last_updated_on: this.db.fn.now(),
      },
      '*',
    );
    return dbResult ? this.mapModelToSubgraph(dbResult) : null;
  }

  async getSubgraphsData(): Promise<Subgraph | null> {
    const dbResult = await this.db<SubgraphModel>(this.SUBGRAPH_TABLE)
      .where('search_id', this.SINGLE_SEARCH_ID)
      .first();
    return dbResult ? this.mapModelToSubgraph(dbResult) : null;
  }

  async updateSubgraphsData(data: Subgraph): Promise<Subgraph | null> {
    const [dbResult] = await this.db<SubgraphDataModel>(this.SUBGRAPH_TABLE)
      .select('*')
      .where('search_id', this.SINGLE_SEARCH_ID)
      .update(
        {
          ...this.mapSubgraphToModel(data),
          last_updated_on: this.db.fn.now(),
        },
        '*',
      );
    return this.mapModelToSubgraph(dbResult) || null;
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

  private mapSubgraphToModel(data: Subgraph): SubgraphModel {
    return {
      search_data: data.searchData,
    };
  }

  private mapModelToSubgraph(data: SubgraphModel): Subgraph {
    return {
      searchData: data.search_data,
      lastUpdatedOn: data.last_updated_on,
    };
  }
}
