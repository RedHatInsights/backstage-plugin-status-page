import { getResultsWithSearchId, getSearchStatus } from '../../api';
import { HydraSplunkStore } from '../../database/HydraSplunkDatabase';
import { HydraNotificationsLogIds, PollingTypes } from './constants';

async function getData(
  pollingType: PollingTypes,
  databaseServer: HydraSplunkStore,
) {
  switch (pollingType) {
    case PollingTypes.HydraNotificationsActiveUsers:
      return (
        (await databaseServer.getSearchDataByLogId(
          HydraNotificationsLogIds.ActiveUsers,
        )) || null
      );
    case PollingTypes.HydraNotificationsServed:
      return (
        (await databaseServer.getSearchDataByLogId(
          HydraNotificationsLogIds.NotificationsServed,
        )) || null
      );
    case PollingTypes.HydraNotificationsPerChannel:
      return (
        (await databaseServer.getSearchDataByLogId(
          HydraNotificationsLogIds.NotificationsPerChannel,
        )) || null
      );
    default:
      return null;
  }
}

async function insertData(
  pollingType: PollingTypes,
  databaseServer: HydraSplunkStore,
  results: any,
) {
  switch (pollingType) {
    case PollingTypes.HydraNotificationsActiveUsers:
      await databaseServer.insertSearchData({
        logId: HydraNotificationsLogIds.ActiveUsers,
        searchData: JSON.stringify({
          data: results,
        }),
      });
      break;
    case PollingTypes.HydraNotificationsServed:
      await databaseServer.insertSearchData({
        logId: HydraNotificationsLogIds.NotificationsServed,
        searchData: JSON.stringify({
          data: results,
        }),
      });
      break;
    case PollingTypes.HydraNotificationsPerChannel:
      await databaseServer.insertSearchData({
        logId: HydraNotificationsLogIds.NotificationsPerChannel,
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
  databaseServer: HydraSplunkStore,
  results: any,
) {
  switch (pollingType) {
    case PollingTypes.HydraNotificationsActiveUsers:
      await databaseServer.updateSearchDataByLogId({
        logId: HydraNotificationsLogIds.ActiveUsers,
        searchData: JSON.stringify({
          data: results,
        }),
      });
      break;
    case PollingTypes.HydraNotificationsServed:
      await databaseServer.updateSearchDataByLogId({
        logId: HydraNotificationsLogIds.NotificationsServed,
        searchData: JSON.stringify({
          data: results,
        }),
      });
      break;

    case PollingTypes.HydraNotificationsPerChannel:
      await databaseServer.updateSearchDataByLogId({
        logId: HydraNotificationsLogIds.NotificationsPerChannel,
        searchData: JSON.stringify({
          data: results,
        }),
      });
      break;
    default:
      break;
  }
}

export function hydraPolling(
  splunkApiHost: string,
  token: string,
  searchId: string,
  databaseServer: HydraSplunkStore,
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
