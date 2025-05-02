import { getSearchId } from '../../api';
import { HydraSplunkStore } from '../../database/HydraSplunkDatabase';
import { hydraPolling } from './HydraSchedulingMethods';

export const triggerFetch = async (
  splunkApiHost: string,
  token: string,
  databaseServer: HydraSplunkStore,
  query: string,
  logId: string,
): Promise<void> => {
  const triggeredSearch = await getSearchId(splunkApiHost, token, query);
  if (triggeredSearch && triggeredSearch.sid) {
    await hydraPolling(
      splunkApiHost,
      token,
      triggeredSearch.sid,
      databaseServer,
      logId,
    );
  }
};
