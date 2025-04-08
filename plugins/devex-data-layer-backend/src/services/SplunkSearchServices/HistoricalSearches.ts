import { getSearchId } from '../../api';
import { DataLayerBackendStore } from '../../database/DataLayerBackendDatabase';
import { PollingTypes, getQueryForNumberOfQueriesClient } from './constants';
import {
  continuesFetchDataUntilDone,
  commonPolling,
} from './schedulingMethods';

export const fetchClientQueriesRecord = async (
  subgraph: string,
  splunkApiHost: string,
  token: string,
  databaseServer: DataLayerBackendStore,
): Promise<void> => {
  const query = getQueryForNumberOfQueriesClient(subgraph);
  const triggeredSearch = await getSearchId(splunkApiHost, token, query);
  if (triggeredSearch && triggeredSearch.sid) {
    await continuesFetchDataUntilDone(
      splunkApiHost,
      token,
      triggeredSearch.sid,
      subgraph,
      databaseServer,
    );
  }
};

export const fetchSubgraphs = async (
  splunkApiHost: string,
  token: string,
  queryForNumberOfSubgraphsDeveloped: string,
  databaseServer: DataLayerBackendStore,
): Promise<void> => {
  const triggeredSubgraphSearch = await getSearchId(
    splunkApiHost,
    token,
    queryForNumberOfSubgraphsDeveloped,
    true,
  );
  if (triggeredSubgraphSearch && triggeredSubgraphSearch.sid) {
    await commonPolling(
      splunkApiHost,
      token,
      triggeredSubgraphSearch.sid,
      databaseServer,
      PollingTypes.Subgraph,
    );
  }
};

export const fetchApiGatewayRequestsRecord = async (
  splunkApiHost: string,
  token: string,
  databaseServer: DataLayerBackendStore,
  query: string,
): Promise<void> => {
  const triggeredSearch = await getSearchId(splunkApiHost, token, query);
  if (triggeredSearch && triggeredSearch.sid) {
    await commonPolling(
      splunkApiHost,
      token,
      triggeredSearch.sid,
      databaseServer,
      PollingTypes.GatewayRequest,
    );
  }
};
