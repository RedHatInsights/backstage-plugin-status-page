import { configApiRef, useApi } from '@backstage/core-plugin-api';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  TActivityStream,
  TApiFilter,
  TDeploymentEnv,
  TDeploymentHistoryByMonth,
  TDeploymentProperty,
  TDeploymentTime,
} from './types';

const apiKeys = {
  deploymentCountByEnv: (filter: TApiFilter) =>
    ['deployment-count', 'env', filter] as const,
  deploymentCountByProperty: ['deployment-count', 'property'] as const,
  deploymentTime: (days: number, filter: TApiFilter) =>
    ['deployment-time', { days }, filter] as const,
  activityStream: (filter: TApiFilter & { limit: number }) =>
    ['activity-stream', filter] as const,
  deploymentHistoryByMonth: (filter: TApiFilter) =>
    ['deployment-history-month', { filter }] as const,
};

export const useGetDeploymentHistoryByMonth = (filters: TApiFilter = {}) => {
  const config = useApi(configApiRef);
  const backendUrl = config.getString('backend.baseUrl');

  const params = new URLSearchParams();
  Object.keys(filters).forEach(key => {
    if (Boolean(filters[key as keyof TApiFilter])) {
      params.append(key, filters[key as keyof TApiFilter] as string);
    }
  });

  return useQuery({
    queryKey: apiKeys.deploymentHistoryByMonth(filters),
    queryFn: async (): Promise<TDeploymentHistoryByMonth> => {
      const res = await fetch(
        `${backendUrl}/api/proxy/spaship/v1/analytics/deployment/env/month?${params}`,
      );
      const data = await res.json();
      return data?.data;
    },
    select: deployment => {
      const history: Array<Record<string, string | number>> = [];
      const envs = Object.keys(deployment);
      if (!envs.length) return [];
      // get the number of points inside an env
      const envByMaxKey = envs.reduce((prev, env) =>
        deployment[prev].length > deployment[env].length ? prev : env,
      );
      const frequency = deployment[envByMaxKey].length;

      for (let i = 0; i < frequency; i++) {
        const cell: Record<string, string | number> = {
          date: deployment[envByMaxKey][i].endDate,
        };
        Object.keys(deployment).forEach(env => {
          cell[env] = deployment?.[env]?.[i]?.count || 0;
        });
        history.push(cell);
      }

      return history;
    },
  });
};

export const useGetDeploymentCountByProperty = () => {
  const config = useApi(configApiRef);
  const backendUrl = config.getString('backend.baseUrl');

  return useQuery({
    queryKey: apiKeys.deploymentCountByProperty,
    queryFn: async (): Promise<TDeploymentProperty[]> => {
      const res = await fetch(
        `${backendUrl}/api/proxy/spaship/v1/analytics/deployment/count`,
      );
      const data = await res.json();
      return data?.data;
    },
  });
};

export const useGetActiviyStream = (
  filters: TApiFilter & { limit: number } = { limit: 20 },
) => {
  const config = useApi(configApiRef);
  const backendUrl = config.getString('backend.baseUrl');

  const params = new URLSearchParams({
    action: 'APPLICATION_DEPLOYED',
  });
  Object.keys(filters).forEach(key => {
    if (Boolean(filters[key as keyof TApiFilter])) {
      params.append(key, filters[key as keyof TApiFilter] as string);
    }
  });

  return useInfiniteQuery<TActivityStream[]>({
    queryKey: apiKeys.activityStream(filters),
    queryFn: async ({ pageParam = 0 }): Promise<TActivityStream[]> => {
      params.set('skip', pageParam);
      const res = await fetch(
        `${backendUrl}/api/proxy/spaship/v1/analytics/activity-stream?${params}`,
      );
      const data = await res.json();
      return data?.data;
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage?.length !== 0 ? pages.length * filters.limit : undefined,
  });
};

export const useGetDeploymentTime = (days = 30, filters: TApiFilter = {}) => {
  const config = useApi(configApiRef);
  const backendUrl = config.getString('backend.baseUrl');

  const params = new URLSearchParams({ days: days.toString() });
  Object.keys(filters).forEach(key => {
    if (Boolean(filters[key as keyof TApiFilter])) {
      params.append(key, filters[key as keyof TApiFilter] as string);
    }
  });

  return useQuery({
    queryKey: apiKeys.deploymentTime(days, filters),
    queryFn: async (): Promise<TDeploymentTime> => {
      const res = await fetch(
        `${backendUrl}/api/proxy/spaship/v1/analytics/deployment/time?${params}`,
      );
      const data = await res.json();
      return data?.data;
    },
  });
};

export const useGetDeploymentCountByEnv = (filters: TApiFilter = {}) => {
  const config = useApi(configApiRef);
  const backendUrl = config.getString('backend.baseUrl');

  const params = new URLSearchParams();
  Object.keys(filters).forEach(key => {
    if (Boolean(filters[key as keyof TApiFilter])) {
      params.append(key, filters[key as keyof TApiFilter] as string);
    }
  });

  return useQuery({
    queryKey: apiKeys.deploymentCountByEnv(filters),
    queryFn: async (): Promise<TDeploymentEnv[]> => {
      const res = await fetch(
        `${backendUrl}/api/proxy/spaship/v1/analytics/deployment/env?${params}`,
      );
      const data = await res.json();
      return data?.data;
    },
    select: data => {
      const sum = data.reduce((prev, { count }) => (prev += count), 0);
      const eph = data.find(({ env }) => env === 'ephemeral')?.count || 0;
      const others = data.reduce((prev, { count, env }) => {
        if (
          env === 'qa' ||
          env === 'dev' ||
          env === 'stage' ||
          env === 'prod'
        ) {
          return prev;
        }
        return prev + count;
      }, 0);
      const deployments = data
        .filter(
          ({ env }) =>
            env === 'qa' || env === 'dev' || env === 'stage' || env === 'prod',
        )
        .sort((a, b) => a.env.localeCompare(b.env));
      deployments.push({ env: 'others', count: others });

      return { total: sum, deployments, eph };
    },
  });
};
