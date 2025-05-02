import { getResultsWithSearchId, getSearchStatus } from '../../api';
import { HydraSplunkStore } from '../../database/HydraSplunkDatabase';

async function getData(logId: string, databaseServer: HydraSplunkStore) {
  return (await databaseServer.getSearchDataByLogId(logId)) || null;
}

async function insertData(
  logId: string,
  databaseServer: HydraSplunkStore,
  results: any,
) {
  await databaseServer.insertSearchData({
    logId: logId,
    searchData: JSON.stringify({
      data: results,
    }),
  });
}

async function updateData(
  logId: string,
  databaseServer: HydraSplunkStore,
  results: any,
) {
  await databaseServer.updateSearchDataByLogId({
    logId: logId,
    searchData: JSON.stringify({
      data: results,
    }),
  });
}

export function hydraPolling(
  splunkApiHost: string,
  token: string,
  searchId: string,
  databaseServer: HydraSplunkStore,
  logId: string,
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
          const dbResult = await getData(logId, databaseServer);

          if (!dbResult) {
            await insertData(
              logId,
              databaseServer,
              searchResultResponse.results,
            );
          } else if (
            searchStatusResponse?.entry &&
            searchStatusResponse.entry[0].content.isDone
          ) {
            await updateData(
              logId,
              databaseServer,
              searchResultResponse.results,
            );
            clearInterval(interval);
            resolve('Success: Search completed, stopping api calls');
          }
        }
      } catch (error) {
        clearInterval(interval);
        reject('Error: Stopping polling');
      }
    }, 10000);
  });
}
