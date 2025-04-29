import { getSearchId } from '../../api';
import { HydraSplunkStore } from '../../database/HydraSplunkDatabase';
import { hydraPolling } from './HydraSchedulingMethods';
import {
  PollingTypes,
  queryForNotificationsActiveUsers,
  queryForNotificationsPerChannel,
  queryForNotificationsServed,
} from './constants';

export const fetchNotificationActiveUsers = async (
  splunkApiHost: string,
  token: string,
  databaseServer: HydraSplunkStore,
): Promise<void> => {
  const triggeredSearch = await getSearchId(
    splunkApiHost,
    token,
    queryForNotificationsActiveUsers,
  );
  if (triggeredSearch && triggeredSearch.sid) {
    await hydraPolling(
      splunkApiHost,
      token,
      triggeredSearch.sid,
      databaseServer,
      PollingTypes.HydraNotificationsActiveUsers,
    );
  }
};

export const fetchNotificationsServed = async (
  splunkApiHost: string,
  token: string,
  databaseServer: HydraSplunkStore,
): Promise<void> => {
  const triggeredSearch = await getSearchId(
    splunkApiHost,
    token,
    queryForNotificationsServed,
  );
  if (triggeredSearch && triggeredSearch.sid) {
    await hydraPolling(
      splunkApiHost,
      token,
      triggeredSearch.sid,
      databaseServer,
      PollingTypes.HydraNotificationsServed,
    );
  }
};

export const fetchNotificationsPerChannel = async (
  splunkApiHost: string,
  token: string,
  databaseServer: HydraSplunkStore,
): Promise<void> => {
  const triggeredSearch = await getSearchId(
    splunkApiHost,
    token,
    queryForNotificationsPerChannel,
  );
  if (triggeredSearch && triggeredSearch.sid) {
    await hydraPolling(
      splunkApiHost,
      token,
      triggeredSearch.sid,
      databaseServer,
      PollingTypes.HydraNotificationsPerChannel,
    );
  }
};
