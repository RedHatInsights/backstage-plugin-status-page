import { useEffect, useCallback } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import { useAsyncFn } from 'react-use';
import { handleError } from './utils';
import { jiraApiRef } from '../api';

export const useProjectInfo = (
  projectKey: string,
  component: string,
  label: string,
  statusesNames: Array<string>,
) => {
  const api = useApi(jiraApiRef);

  const getProjectDetails = useCallback(async () => {
    try {
      setTimeout(() => (document.activeElement as HTMLElement).blur(), 0);
      return await api.getProjectDetails(
        projectKey,
        component,
        label,
        statusesNames,
      );
    } catch (err: any) {
      return handleError(err);
    }
  }, [api, projectKey, component, label, statusesNames]);

  const [state, fetchProjectInfo] = useAsyncFn(
    () => getProjectDetails(),
    [statusesNames],
  );

  useEffect(() => {
    fetchProjectInfo();
  }, [statusesNames, fetchProjectInfo]);
  return {
    projectLoading: state.loading,
    project: state?.value?.project,
    issues: state?.value?.issues,
    tickets: state?.value?.tickets,
    projectError: state.error,
    fetchProjectInfo,
  };
};
