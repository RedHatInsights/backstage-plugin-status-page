import { useApi } from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import {
  ArtEntity,
  WorkstreamEntity,
} from '@compass/backstage-plugin-workstream-automation-common';
import { useAsyncRetry } from 'react-use';

export type WorkstreamState = {
  loading: boolean;
  error: Error | undefined;
  workstreams: WorkstreamEntity[];
  arts: ArtEntity[];
  refresh: () => void;
};

export function useWorkstreams(): WorkstreamState {
  const catalogApi = useApi(catalogApiRef);

  const { loading, error, value, retry } = useAsyncRetry(async () => {
    const resp1 = await catalogApi.getEntities({
      filter: { kind: 'workstream' },
    });
    const resp2 = await catalogApi.getEntities({
      filter: { kind: 'ART' },
    });
    return {
      workstreams: resp1.items as WorkstreamEntity[],
      arts: resp2.items as ArtEntity[],
    };
  }, [catalogApi]);

  return {
    loading,
    error,
    workstreams: value?.workstreams ?? [],
    arts: value?.arts ?? [],
    refresh: retry,
  };
}
