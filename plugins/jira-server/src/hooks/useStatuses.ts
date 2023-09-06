import { useCallback } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import { useAsync } from 'react-use';
import { handleError } from './utils';
import { jiraApiRef } from '../api';

export const useStatuses = (projectKey: string) => {
  const api = useApi(jiraApiRef);

  const getStatuses = useCallback(async () => {
    try {
      return await api.getStatuses(projectKey);
    } catch (err: any) {
      return handleError(err);
    }
  }, [api, projectKey]);

  const { loading, value, error } = useAsync(() => getStatuses(), []);
  return {
    statusesLoading: loading,
    statuses: value,
    statusesError: error,
  };
};
