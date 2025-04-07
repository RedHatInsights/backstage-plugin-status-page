import {
  AuthService,
  LoggerService,
  DatabaseService,
} from '@backstage/backend-plugin-api';
import {
  getQueryForNumberOfQueriesClient,
  queryForNumberOfSubgraphsDeveloped,
} from './constants';
import { getSearchId } from '../../api';
import {
  continuesFetchDataUntilDone,
  subgraphsPolling,
} from './schedulingMethods';
import { DataLayerBackendDatabase } from '../../database/DataLayerBackendDatabase';

export async function CreateSplunkQueryService({
  logger,
  splunkApiHost,
  token,
  database,
}: {
  auth: AuthService;
  logger: LoggerService;
  splunkApiHost: string;
  token: string;
  database: DatabaseService;
  subgraphsSnippetUrl: string;
}): Promise<any> {
  logger.info('Initializing SplunkQueryService');
  const databaseServer = await DataLayerBackendDatabase.create({
    knex: await database.getClient(),
    skipMigrations: true,
  });

  return {
    async fetchHistoricalData() {
      try {
        const triggeredSubgraphSearch = await getSearchId(
          splunkApiHost,
          token,
          queryForNumberOfSubgraphsDeveloped,
          true,
        );
        if (triggeredSubgraphSearch && triggeredSubgraphSearch.sid) {
          await subgraphsPolling(
            splunkApiHost,
            token,
            triggeredSubgraphSearch.sid,
            databaseServer,
          );
        }
        let subgraphNames: string[] = [];
        const cachedSubgraphs = await databaseServer.getSubgraphsData();
        if (cachedSubgraphs?.searchData) {
          subgraphNames = JSON.parse(cachedSubgraphs?.searchData).data.map(
            (data: { [key: string]: string }) => {
              return Object.values(data)[0];
            },
          );
        }

        if (subgraphNames.length) {
          for (const subgraph of subgraphNames) {
            const query = getQueryForNumberOfQueriesClient(subgraph);
            const triggeredSearch = await getSearchId(
              splunkApiHost,
              token,
              query,
            );
            if (triggeredSearch && triggeredSearch.sid) {
              await continuesFetchDataUntilDone(
                splunkApiHost,
                token,
                triggeredSearch.sid,
                subgraph,
                databaseServer,
              );
            }
          }
        }
      } catch (err) {
        logger.error(String(err));
      }
    },
  };
}
