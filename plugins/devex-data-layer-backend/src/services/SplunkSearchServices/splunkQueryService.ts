import {
  AuthService,
  LoggerService,
  DatabaseService,
} from '@backstage/backend-plugin-api';
import {
  PollingTypes,
  queryForAkamaiApiGatewayRequestsRecord,
  queryForAkamaiApiGatewayResponseTimeRecord,
  queryForNumberOfSubgraphsDeveloped,
  queryForTotalRequestOnInternalServer,
  queryForTotalRequestOnPublicServer,
} from './constants';
import { DataLayerBackendDatabase } from '../../database/DataLayerBackendDatabase';
import {
  fetchApiGatewayRequestsRecord,
  fetchClientQueriesRecord,
  fetchErrorRatesPerSubgraph,
  fetchSubgraphs,
} from './HistoricalSearches';
import { HydraSplunkDatabase } from '../../database/HydraSplunkDatabase';
import {
  fetchNotificationActiveUsers,
  fetchNotificationsPerChannel,
  fetchNotificationsServed,
} from './HydraSearches';

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

  const hydraDatabaseServer = await HydraSplunkDatabase.create({
    knex: await database.getClient(),
    skipMigrations: true,
  });

  return {
    async fetchDTLHistoricalData() {
      try {
        await fetchSubgraphs(
          splunkApiHost,
          token,
          queryForNumberOfSubgraphsDeveloped,
          databaseServer,
        );

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
          subgraphNames.sort((stringValueOne, stringValueTwo) =>
            stringValueOne.localeCompare(stringValueTwo),
          );

          for (const subgraph of subgraphNames) {
            await fetchClientQueriesRecord(
              subgraph,
              splunkApiHost,
              token,
              databaseServer,
            );

            await fetchErrorRatesPerSubgraph(
              subgraph,
              splunkApiHost,
              token,
              databaseServer,
            );
          }
        }

        await fetchApiGatewayRequestsRecord(
          splunkApiHost,
          token,
          databaseServer,
          queryForAkamaiApiGatewayRequestsRecord,
          PollingTypes.GatewayRequest,
        );

        await fetchApiGatewayRequestsRecord(
          splunkApiHost,
          token,
          databaseServer,
          queryForAkamaiApiGatewayResponseTimeRecord,
          PollingTypes.GatewayResponseTime,
        );

        await fetchApiGatewayRequestsRecord(
          splunkApiHost,
          token,
          databaseServer,
          queryForTotalRequestOnInternalServer,
          PollingTypes.GatewayInternal,
        );

        await fetchApiGatewayRequestsRecord(
          splunkApiHost,
          token,
          databaseServer,
          queryForTotalRequestOnPublicServer,
          PollingTypes.GatewayPublic,
        );
      } catch (err) {
        logger.error(String(err));
      }
    },
    async fetchHydraHistoricalData() {
      try {
        await fetchNotificationActiveUsers(
          splunkApiHost,
          token,
          hydraDatabaseServer,
        );

        await fetchNotificationsServed(
          splunkApiHost,
          token,
          hydraDatabaseServer,
        );

        await fetchNotificationsPerChannel(
          splunkApiHost,
          token,
          hydraDatabaseServer,
        );
      } catch (err) {
        logger.error(String(err));
      }
    },
  };
}
