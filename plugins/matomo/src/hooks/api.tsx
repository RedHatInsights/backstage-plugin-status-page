import { useQuery } from '@tanstack/react-query';
import { configApiRef, useApi } from '@backstage/core-plugin-api';
import {
  TActionByPageURLMetrics,
  TActionMetrics,
  TDeviceMetrics,
  TGeoMetrics,
  TUserVisitMetrics,
  TUserVisitReportData,
} from './types';

const apiKeys = {
  metrics: (siteId: string, period: string, date: string) =>
    ['metrics', { siteId, period, date }] as const,
  geoMetrics: (siteId: string, period: string, date: string) =>
    ['geo-metrics', { siteId, period, date }] as const,
  deviceMetrics: (siteId: string, period: string, date: string) =>
    ['device-metrics', { siteId, period, date }] as const,
  actionMetrics: (siteId: string, period: string, date: string) =>
    ['action-metrics', { siteId, period, date }] as const,
  actionByPageMetrics: (siteId: string, period: string, date: string) =>
    ['action-page-metrics', { siteId, period, date }] as const,
};

export const useGetUserVisitMetrics = <T extends any>(
  idSite = '',
  period = 'day',
  date = 'yesterday',
  select?: (data: TUserVisitMetrics) => T,
) => {
  const config = useApi(configApiRef);
  const backendUrl = config.getString('backend.baseUrl');

  return useQuery({
    queryKey: apiKeys.metrics(idSite, period, date),
    enabled: Boolean(idSite),
    queryFn: async (): Promise<TUserVisitMetrics> => {
      const res = await fetch(
        `${backendUrl}/api/matomo?module=API&format=json`,
        {
          method: 'POST',
          body: new URLSearchParams({
            idSite,
            method: 'API.getProcessedReport',
            period,
            date,
            apiModule: 'VisitsSummary',
            apiAction: 'get',
          }).toString(),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          },
        },
      );
      return res.json();
    },
    select,
  });
};

export const useGetUserVisitSummary = (
  idSite = '',
  period = 'day',
  date = 'yesterday',
) => useGetUserVisitMetrics<TUserVisitMetrics>(idSite, period, date);

export const useGetUserVisitByTime = (
  idSite = '',
  period = 'day',
  date = 'last10',
) =>
  useGetUserVisitMetrics(
    idSite,
    period,
    date,
    ({ reportData }: TUserVisitMetrics) => {
      const data: { name: string; visitors: number; uniqVisitors: number }[] =
        [];
      Object.keys(reportData).forEach(key => {
        data.push({
          name: key,
          visitors:
            (
              reportData[
                key as keyof TUserVisitReportData
              ] as TUserVisitReportData
            ).nb_visits || 0,
          uniqVisitors:
            (
              reportData[
                key as keyof TUserVisitReportData
              ] as TUserVisitReportData
            ).nb_uniq_visitors || 0,
        });
      });
      return data.sort(
        (a, b) => new Date(a.name).valueOf() - new Date(b.name).valueOf(),
      );
    },
  );

export const useGetUserGeoMetrics = (
  idSite = '',
  period = 'day',
  date = 'yesterday',
) => {
  const config = useApi(configApiRef);
  const backendUrl = config.getString('backend.baseUrl');

  return useQuery({
    queryKey: apiKeys.geoMetrics(idSite, period, date),
    enabled: Boolean(idSite),
    queryFn: async (): Promise<TGeoMetrics> => {
      const res = await fetch(
        `${backendUrl}/api/matomo?module=API&format=json`,
        {
          method: 'POST',
          body: new URLSearchParams({
            idSite,
            method: 'API.getProcessedReport',
            period,
            date,
            apiModule: 'UserCountry',
            apiAction: 'getCountry',
          }).toString(),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          },
        },
      );
      return res.json();
    },
  });
};

export const useGetUserDeviceMetrics = (
  idSite = '',
  period = 'day',
  date = 'yesterday',
) => {
  const config = useApi(configApiRef);
  const backendUrl = config.getString('backend.baseUrl');

  return useQuery({
    queryKey: apiKeys.deviceMetrics(idSite, period, date),
    enabled: Boolean(idSite),
    queryFn: async (): Promise<TDeviceMetrics> => {
      const res = await fetch(
        `${backendUrl}/api/matomo?module=API&format=json`,
        {
          method: 'POST',
          body: new URLSearchParams({
            idSite,
            method: 'API.getProcessedReport',
            period,
            date,
            apiModule: 'DevicesDetection',
            apiAction: 'getType',
          }).toString(),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          },
        },
      );
      return res.json();
    },
  });
};

export const useGetUserActionByPageURL = (
  idSite = '',
  period = 'day',
  date = 'yesterday',
) => {
  const config = useApi(configApiRef);
  const backendUrl = config.getString('backend.baseUrl');

  return useQuery({
    queryKey: apiKeys.actionByPageMetrics(idSite, period, date),
    enabled: Boolean(idSite),
    queryFn: async (): Promise<TActionByPageURLMetrics> => {
      const res = await fetch(
        `${backendUrl}/api/matomo?module=API&format=json`,
        {
          method: 'POST',
          body: new URLSearchParams({
            idSite,
            method: 'API.getProcessedReport',
            period,
            date,
            apiModule: 'Actions',
            apiAction: 'getPageUrls',
          }).toString(),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          },
        },
      );
      return res.json();
    },
  });
};

export const useGetUserActionMetrics = (
  idSite = '',
  period = 'day',
  date = 'yesterday',
) => {
  const config = useApi(configApiRef);
  const backendUrl = config.getString('backend.baseUrl');

  return useQuery({
    queryKey: apiKeys.actionMetrics(idSite, period, date),
    enabled: Boolean(idSite),
    queryFn: async (): Promise<TActionMetrics> => {
      const res = await fetch(
        `${backendUrl}/api/matomo?module=API&format=json`,
        {
          method: 'POST',
          body: new URLSearchParams({
            idSite,
            method: 'API.getProcessedReport',
            period,
            date,
            apiModule: 'Actions',
            apiAction: 'get',
          }).toString(),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          },
        },
      );
      return res.json();
    },
    select: ({ columns, reportData }) =>
      Object.keys(columns).map(metric => ({
        metric: columns[metric as keyof TActionMetrics['reportData']],
        value: reportData?.[metric as keyof TActionMetrics['reportData']],
      })),
  });
};
