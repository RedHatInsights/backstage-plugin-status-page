import { Knex } from 'knex';
import { resolvePackagePath } from '@backstage/backend-plugin-api';
import { Subgraph, SubgraphData, SubgraphDataModel } from '../types';
import {
  GatewayRequest,
  GatewayRequestModel,
  SubgraphModel,
} from '../types/database';

const migrationsDir = resolvePackagePath(
  '@appdev/backstage-plugin-devex-data-layer-backend',
  'migrations',
);

export interface DataLayerBackendStore {
  insertSearchData(data: SubgraphData): Promise<SubgraphData>;
  getSearchDataBySubgraph(subgraph: string): Promise<SubgraphData | null>;
  updateSearchDataBySubgraph(data: SubgraphData): Promise<SubgraphData | null>;

  insertSubgraphs(data: Subgraph): Promise<Subgraph | null>;
  getSubgraphsData(): Promise<Subgraph | null>;
  updateSubgraphsData(data: Subgraph): Promise<Subgraph | null>;

  insertGateWayRequests(data: GatewayRequest): Promise<GatewayRequest | null>;
  getGateWayRequests(): Promise<GatewayRequest | null>;
  updateGateWayRequests(data: GatewayRequest): Promise<GatewayRequest | null>;

  insertErrorData(data: SubgraphData): Promise<SubgraphData>;
  getErrorDataBySubgraph(subgraph: string): Promise<SubgraphData | null>;
  updateErrorDataBySubgraph(data: SubgraphData): Promise<SubgraphData | null>;

  insertResponseTimeData(data: GatewayRequest): Promise<GatewayRequest | null>;
  getResponseTimeData(): Promise<GatewayRequest | null>;
  updateResponseTimeData(data: GatewayRequest): Promise<GatewayRequest | null>;

  insertQueryTypeData(
    data: GatewayRequest,
    isPublic: boolean,
  ): Promise<GatewayRequest | null>;
  getQueryTypeData(isPublic: boolean): Promise<GatewayRequest | null>;
  updateQueryTypeData(
    data: GatewayRequest,
    isPublic: boolean,
  ): Promise<GatewayRequest | null>;
}

export class DataLayerBackendDatabase implements DataLayerBackendDatabase {
  private readonly DATA_LAYER_TABLE = 'datalayer';
  private readonly SUBGRAPH_TABLE = 'subgraphs';
  private readonly QUERY_ERROR_TABLE = 'query_errors';

  private readonly AKAMAI_ACCESS = 'akamai_access';
  private readonly SINGLE_SEARCH_ID = 'subgraph_search__id';
  private readonly AKAMAI_ACCESS_REQUESTS_SEARCH_ID =
    'akamai_access_requests_search__id';
  private readonly AKAMAI_ACCESS_RESPONSE_TIME_SEARCH_ID =
    'akamai_access_response_time_search__id';

  private readonly AKAMAI_ACCESS_INTERNAL_QUERIES_SEARCH_ID =
    'akamai_access_internal_query_search__id';
  private readonly AKAMAI_ACCESS_EXTERNAL_QUERIES_SEARCH_ID =
    'akamai_access_external_query_search__id';

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
        search_id: this.SINGLE_SEARCH_ID,
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

  async insertGateWayRequests(
    data: GatewayRequest,
  ): Promise<GatewayRequest | null> {
    const [dbResult] = await this.db<GatewayRequestModel>(
      this.AKAMAI_ACCESS,
    ).insert(
      {
        log_id: this.AKAMAI_ACCESS_REQUESTS_SEARCH_ID,
        ...this.mapGatewayRequestToModel(data),
        last_updated_on: this.db.fn.now(),
      },
      '*',
    );
    return dbResult ? this.mapModelToGatewayRequest(dbResult) : null;
  }

  async getGateWayRequests(): Promise<GatewayRequest | null> {
    const dbResult = await this.db<GatewayRequestModel>(this.AKAMAI_ACCESS)
      .where('log_id', this.AKAMAI_ACCESS_REQUESTS_SEARCH_ID)
      .first();
    return dbResult ? this.mapModelToGatewayRequest(dbResult) : null;
  }

  async updateGateWayRequests(
    data: GatewayRequest,
  ): Promise<GatewayRequest | null> {
    const [dbResult] = await this.db<GatewayRequestModel>(this.AKAMAI_ACCESS)
      .select('*')
      .where('log_id', this.AKAMAI_ACCESS_REQUESTS_SEARCH_ID)
      .update(
        {
          ...this.mapGatewayRequestToModel(data),
          last_updated_on: this.db.fn.now(),
        },
        '*',
      );
    return this.mapModelToGatewayRequest(dbResult) || null;
  }

  async insertErrorData(data: SubgraphData): Promise<SubgraphData> {
    const [dbResult] = await this.db<SubgraphDataModel>(
      this.QUERY_ERROR_TABLE,
    ).insert(
      {
        ...this.mapSubgraphDataToDatabaseModel({ ...data }),
        last_updated_on: this.db.fn.now(),
      },
      '*',
    );
    return this.mapDatabaseModelToSubgraphData(dbResult);
  }
  async getErrorDataBySubgraph(subgraph: string): Promise<SubgraphData | null> {
    const dbResult = await this.db<SubgraphDataModel>(this.QUERY_ERROR_TABLE)
      .where('subgraph', subgraph)
      .first();
    return dbResult ? this.mapDatabaseModelToSubgraphData(dbResult) : null;
  }

  async updateErrorDataBySubgraph(
    data: SubgraphData,
  ): Promise<SubgraphData | null> {
    const [dbResult] = await this.db<SubgraphDataModel>(this.QUERY_ERROR_TABLE)
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

  async insertResponseTimeData(
    data: GatewayRequest,
  ): Promise<GatewayRequest | null> {
    const [dbResult] = await this.db<GatewayRequestModel>(
      this.AKAMAI_ACCESS,
    ).insert(
      {
        log_id: this.AKAMAI_ACCESS_RESPONSE_TIME_SEARCH_ID,
        ...this.mapGatewayRequestToModel(data),
        last_updated_on: this.db.fn.now(),
      },
      '*',
    );
    return dbResult ? this.mapModelToGatewayRequest(dbResult) : null;
  }
  async getResponseTimeData(): Promise<GatewayRequest | null> {
    const dbResult = await this.db<GatewayRequestModel>(this.AKAMAI_ACCESS)
      .where('log_id', this.AKAMAI_ACCESS_RESPONSE_TIME_SEARCH_ID)
      .first();
    return dbResult ? this.mapModelToGatewayRequest(dbResult) : null;
  }

  async updateResponseTimeData(
    data: GatewayRequest,
  ): Promise<GatewayRequest | null> {
    const [dbResult] = await this.db<GatewayRequestModel>(this.AKAMAI_ACCESS)
      .select('*')
      .where('log_id', this.AKAMAI_ACCESS_RESPONSE_TIME_SEARCH_ID)
      .update(
        {
          ...this.mapGatewayRequestToModel(data),
          last_updated_on: this.db.fn.now(),
        },
        '*',
      );
    return this.mapModelToGatewayRequest(dbResult) || null;
  }

  async insertQueryTypeData(
    data: GatewayRequest,
    isPublic: boolean,
  ): Promise<GatewayRequest | null> {
    const [dbResult] = await this.db<GatewayRequestModel>(
      this.AKAMAI_ACCESS,
    ).insert(
      {
        log_id: isPublic
          ? this.AKAMAI_ACCESS_EXTERNAL_QUERIES_SEARCH_ID
          : this.AKAMAI_ACCESS_INTERNAL_QUERIES_SEARCH_ID,
        ...this.mapGatewayRequestToModel(data),
        last_updated_on: this.db.fn.now(),
      },
      '*',
    );
    return dbResult ? this.mapModelToGatewayRequest(dbResult) : null;
  }
  async getQueryTypeData(isPublic: boolean): Promise<GatewayRequest | null> {
    const dbResult = await this.db<GatewayRequestModel>(this.AKAMAI_ACCESS)
      .where(
        'log_id',
        isPublic
          ? this.AKAMAI_ACCESS_EXTERNAL_QUERIES_SEARCH_ID
          : this.AKAMAI_ACCESS_INTERNAL_QUERIES_SEARCH_ID,
      )
      .first();
    return dbResult ? this.mapModelToGatewayRequest(dbResult) : null;
  }
  async updateQueryTypeData(
    data: GatewayRequest,
    isPublic: boolean,
  ): Promise<GatewayRequest | null> {
    const [dbResult] = await this.db<GatewayRequestModel>(this.AKAMAI_ACCESS)
      .select('*')
      .where(
        'log_id',
        isPublic
          ? this.AKAMAI_ACCESS_EXTERNAL_QUERIES_SEARCH_ID
          : this.AKAMAI_ACCESS_INTERNAL_QUERIES_SEARCH_ID,
      )
      .update(
        {
          ...this.mapGatewayRequestToModel(data),
          last_updated_on: this.db.fn.now(),
        },
        '*',
      );
    return this.mapModelToGatewayRequest(dbResult) || null;
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

  private mapGatewayRequestToModel(data: GatewayRequest): GatewayRequestModel {
    return {
      search_data: data.searchData,
    };
  }

  private mapModelToGatewayRequest(data: GatewayRequestModel): GatewayRequest {
    return {
      searchData: data.search_data,
      lastUpdatedOn: data.last_updated_on,
    };
  }
}
