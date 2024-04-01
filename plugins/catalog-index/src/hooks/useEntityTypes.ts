import { useApi } from '@backstage/core-plugin-api';
import {
  EntityTypeFilter,
  catalogApiRef,
} from '@backstage/plugin-catalog-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAsync } from 'react-use';
import { usePaginatedEntityList } from '../contexts/PaginatedEntityListProvider';
import { isEqual, sortBy } from 'lodash';

export function useEntityTypeFilter(): {
  loading: boolean;
  error?: Error;
  availableTypes: string[];
  selectedTypes: string[];
  setSelectedTypes: (types: string[]) => void;
} {
  const catalogApi = useApi(catalogApiRef);
  const {
    filters: { kind: kindFilter, type: typeFilter },
    queryParameters: { type: typeParameter },
    updateFilters,
  } = usePaginatedEntityList();

  const flattenedQueryTypes = useMemo(
    () => [typeParameter].flat().filter(Boolean) as string[],
    [typeParameter],
  );

  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    flattenedQueryTypes.length
      ? flattenedQueryTypes
      : typeFilter?.getTypes() ?? [],
  );

  useEffect(() => {
    if (flattenedQueryTypes.length) {
      setSelectedTypes(flattenedQueryTypes);
    }
  }, [flattenedQueryTypes]);

  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  const kind = useMemo(() => kindFilter?.value, [kindFilter]);

  const {
    error,
    loading,
    value: facets,
  } = useAsync(async () => {
    if (kind) {
      const items = await catalogApi
        .getEntityFacets({
          filter: { kind },
          facets: ['spec.type'],
        })
        .then(response => response.facets['spec.type'] || []);
      return items;
    }
    return [];
  }, [kind, catalogApi]);

  const facetsRef = useRef(facets);
  useEffect(() => {
    const oldFacets = facetsRef.current;
    facetsRef.current = facets;

    if (loading || !kind || oldFacets === facets || !facets) {
      return;
    }

    /* Sort by facet count descending, so the most common types appear on top */
    const newTypes = [
      ...new Set(
        sortBy(facets, f => -f.count).map(f =>
          f.value.toLocaleLowerCase('en-US'),
        ),
      ),
    ];
    setAvailableTypes(newTypes);

    /* Update type filter to only valid values when the list of available types has changed */
    const stillValidTypes = selectedTypes.filter(value =>
      newTypes.includes(value),
    );
    if (!isEqual(selectedTypes, stillValidTypes)) {
      setSelectedTypes(stillValidTypes);
    }
  }, [loading, kind, selectedTypes, setSelectedTypes, facets]);

  useEffect(() => {
    updateFilters({
      type: selectedTypes.length
        ? new EntityTypeFilter(selectedTypes)
        : undefined,
    });
  }, [selectedTypes, updateFilters]);

  return {
    loading,
    error,
    availableTypes,
    selectedTypes,
    setSelectedTypes,
  };
}
