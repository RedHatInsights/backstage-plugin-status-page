import { getResultsWithSearchId, getSearchStatus } from '../../api';

export function continuesFetchDataUntilDone(
  splunkApiHost: string,
  token: string,
  searchId: string,
  subgraph: string,
  databaseServer: any,
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

        // Store the new data her
        if (searchResultResponse && searchResultResponse.results) {
          const dbResult = await databaseServer.getSearchDataBySubgraph(
            subgraph,
          );

          if (dbResult)
            await databaseServer.updateSearchDataBySubgraph({
              subgraph: subgraph,
              searchData: JSON.stringify({
                data: searchResultResponse.results,
              }),
            });
          else
            await databaseServer.insertSearchData({
              subgraph: subgraph,
              searchData: JSON.stringify({
                data: searchResultResponse.results,
              }),
            });
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
        reject("Error: Stopping polling");
      }
    }, 10000);
  });
}
