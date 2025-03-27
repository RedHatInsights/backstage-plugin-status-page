import {
  AuthService,
  LoggerService,
  DatabaseService,
} from '@backstage/backend-plugin-api';
import { getQueryForNumberOfQueriesClient } from './constants';
import { getSearchId, getSubgraphs } from '../../api';
import { continuesFetchDataUntilDone } from './schedulingMethods';
import { DataLayerBackendDatabase } from '../../database/DataLayerBackendDatabase';

export async function CreateSplunkQueryService({
  logger,
  splunkApiHost,
  token,
  database,
  subgraphsSnippetUrl,
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
      const subgraphs = await getSubgraphs(subgraphsSnippetUrl);

      if (subgraphs)
        for (const subgraph in Object.keys(subgraphs)) {
          if (Object.keys(subgraphs).includes(subgraph)) {
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
    },
  };
}
