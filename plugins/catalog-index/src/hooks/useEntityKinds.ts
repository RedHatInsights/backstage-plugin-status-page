import { useApi } from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { useState } from 'react';
import { useAsyncFn, useDebounce } from 'react-use';

export const useEntityKinds = () => {
  const catalogApi = useApi(catalogApiRef);
  const [kinds, setKinds] = useState([] as {value: string, count: number}[]);

  const [{ loading, error }, refresh] = useAsyncFn(async () => {
    const result = await catalogApi.getEntityFacets({ facets: ['kind'] });
    setKinds(result.facets?.kind);
  }, [catalogApi, setKinds]);

  useDebounce(refresh, 10, []);

  return { loading, error, kinds };
};
