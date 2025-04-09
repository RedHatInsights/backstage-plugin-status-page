import { getResultsWithSearchId, getSearchStatus } from '../../api';
import { DataLayerBackendStore } from '../../database/DataLayerBackendDatabase';
import { PollingTypes } from './constants';

async function getData(
  pollingType: PollingTypes,
  databaseServer: DataLayerBackendStore,
  subgraph?: string,
) {
  switch (pollingType) {
    case PollingTypes.Subgraph:
      return await databaseServer.getSubgraphsData();
    case PollingTypes.GatewayRequest:
      return await databaseServer.getGateWayRequests();
    case PollingTypes.ClientQueries:
      return subgraph
        ? await databaseServer.getSearchDataBySubgraph(subgraph)
        : null;
    case PollingTypes.ErrorRates:
      return subgraph
        ? await databaseServer.getErrorDataBySubgraph(subgraph)
        : null;
    default:
      return null;
  }
}

async function insertData(
  pollingType: PollingTypes,
  databaseServer: DataLayerBackendStore,
  results: any,
  subgraph?: string,
) {
  switch (pollingType) {
    case PollingTypes.Subgraph:
      await databaseServer.insertSubgraphs({
        searchData: JSON.stringify({
          data: results,
        }),
      });
      break;
    case PollingTypes.GatewayRequest:
      await databaseServer.insertGateWayRequests({
        searchData: JSON.stringify({
          data: results,
        }),
      });
      break;
    case PollingTypes.ClientQueries:
      if (subgraph)
        await databaseServer.insertSearchData({
          subgraph: subgraph,
          searchData: JSON.stringify({
            data: results,
          }),
        });
      break;
    case PollingTypes.ErrorRates:
      if (subgraph)
        await databaseServer.insertErrorData({
          subgraph: subgraph,
          searchData: JSON.stringify({
            data: results,
          }),
        });
      break;
    default:
      break;
  }
}

async function updateData(
  pollingType: PollingTypes,
  databaseServer: DataLayerBackendStore,
  results: any,
  subgraph?: string,
) {
  switch (pollingType) {
    case PollingTypes.Subgraph:
      await databaseServer.updateSubgraphsData({
        searchData: JSON.stringify({
          data: results,
        }),
      });
      break;
    case PollingTypes.GatewayRequest:
      await databaseServer.updateGateWayRequests({
        searchData: JSON.stringify({
          data: results,
        }),
      });
      break;
    case PollingTypes.ClientQueries:
      if (subgraph)
        await databaseServer.updateSearchDataBySubgraph({
          subgraph: subgraph,
          searchData: JSON.stringify({
            data: results,
          }),
        });
      break;
    case PollingTypes.ErrorRates:
      if (subgraph)
        await databaseServer.updateErrorDataBySubgraph({
          subgraph: subgraph,
          searchData: JSON.stringify({
            data: results,
          }),
        });
      break;
    default:
      break;
  }
}

export function pollingBySubgraph(
  splunkApiHost: string,
  token: string,
  searchId: string,
  subgraph: string,
  databaseServer: DataLayerBackendStore,
  pollingType: PollingTypes,
) {
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const searchStatusResponse = await getSearchStatus(
          splunkApiHost,
          token,
          searchId,
        );
        const searchResultResponse = await getResultsWithSearchId(
          splunkApiHost,
          token,
          searchId,
        );

        // Store the new data here
        if (searchResultResponse && searchResultResponse.results) {
          const dbResult = await getData(pollingType, databaseServer, subgraph);
          if (dbResult) {
            if (
              JSON.parse(dbResult.searchData).data.length <=
              searchResultResponse.results.length
            )
              await updateData(
                pollingType,
                databaseServer,
                searchResultResponse.results,
                subgraph,
              );
          } else {
            await insertData(
              pollingType,
              databaseServer,
              searchResultResponse.results,
              subgraph,
            );
          }
        }
        if (
          searchStatusResponse &&
          searchStatusResponse.entry &&
          searchStatusResponse.entry[0].content.isDone
        ) {
          clearInterval(interval);
          resolve('Success: Search completed, stopping api calls');
        }
      } catch (error) {
        clearInterval(interval);
        reject('Error: Stopping polling');
      }
    }, 10000);
  });
}

export function commonPolling(
  splunkApiHost: string,
  token: string,
  searchId: string,
  databaseServer: DataLayerBackendStore,
  pollingType: PollingTypes,
) {
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const searchStatusResponse = await getSearchStatus(
          splunkApiHost,
          token,
          searchId,
        );
        const searchResultResponse = await getResultsWithSearchId(
          splunkApiHost,
          token,
          searchId,
        );

        // Store the new data here
        if (searchResultResponse && searchResultResponse.results) {
          const dbResult = await getData(pollingType, databaseServer);

          if (dbResult) {
            if (
              JSON.parse(dbResult.searchData).data.length <=
              searchResultResponse.results.length
            )
              await updateData(
                pollingType,
                databaseServer,
                searchResultResponse.results,
              );
          } else {
            await insertData(
              pollingType,
              databaseServer,
              searchResultResponse.results,
            );
          }
        }
        if (
          searchStatusResponse &&
          searchStatusResponse.entry &&
          searchStatusResponse.entry[0].content.isDone
        ) {
          clearInterval(interval);
          resolve('Success: Search completed, stopping api calls');
        }
      } catch (error) {
        clearInterval(interval);
        reject('Error: Stopping polling');
      }
    }, 10000);
  });
}
