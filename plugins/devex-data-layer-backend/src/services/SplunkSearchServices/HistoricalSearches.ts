import { getSearchId } from '../../api';
import { DataLayerBackendStore } from '../../database/DataLayerBackendDatabase';
import {
  PollingTypes,
  getQueryForErrorRatesPerSubgraph,
  getQueryForNumberOfQueriesClient,
} from './constants';
import { pollingBySubgraph, commonPolling } from './schedulingMethods';

export const fetchClientQueriesRecord = async (
  subgraph: string,
  splunkApiHost: string,
  token: string,
  databaseServer: DataLayerBackendStore,
): Promise<void> => {
  const query = getQueryForNumberOfQueriesClient(subgraph);
  const triggeredSearch = await getSearchId(splunkApiHost, token, query);
  if (triggeredSearch && triggeredSearch.sid) {
    await pollingBySubgraph(
      splunkApiHost,
      token,
      triggeredSearch.sid,
      subgraph,
      databaseServer,
      PollingTypes.ClientQueries,
    );
  }
};

export const fetchErrorRatesPerSubgraph = async (
  subgraph: string,
  splunkApiHost: string,
  token: string,
  databaseServer: DataLayerBackendStore,
): Promise<void> => {
  const query = getQueryForErrorRatesPerSubgraph(subgraph);
  const triggeredSearch = await getSearchId(
    splunkApiHost,
    token,
    query,
    true,
    true,
  );
  if (triggeredSearch && triggeredSearch.sid) {
    await pollingBySubgraph(
      splunkApiHost,
      token,
      triggeredSearch.sid,
      subgraph,
      databaseServer,
      PollingTypes.ErrorRates,
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
  pollingType: PollingTypes
): Promise<void> => {
  const triggeredSearch = await getSearchId(splunkApiHost, token, query);
  if (triggeredSearch && triggeredSearch.sid) {
    await commonPolling(
      splunkApiHost,
      token,
      triggeredSearch.sid,
      databaseServer,
      pollingType,
    );
  }
};
