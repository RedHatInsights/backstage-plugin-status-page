import React, { useEffect, useMemo, useState } from 'react';
import { usePaginatedEntityList } from '../contexts/PaginatedEntityListProvider';
import { useEntityKinds } from '../hooks/useEntityKinds';
import { EntityKindFilter } from '@backstage/plugin-catalog-react';
import { Box } from '@material-ui/core';
import { Select } from '@backstage/core-components';
import { alertApiRef, useApi } from '@backstage/core-plugin-api';

export const EntityKindPicker = (props: {
  hidden?: boolean;
  initialFilter?: string;
}) => {
  const { hidden, initialFilter = 'component' } = props;

  const alertApi = useApi(alertApiRef);

  const {
    filters,
    queryParameters: { kind: kindParameter },
    updateFilters,
  } = usePaginatedEntityList();
  const { error, kinds } = useEntityKinds();

  const queryParamKind = useMemo(() => [kindParameter].flat()[0], [kindParameter]);

  const [selectedKind, setSelectedKind] = useState(
    queryParamKind ?? filters.kind?.value ?? initialFilter,
  );

  useEffect(() => {
    if (error) {
      alertApi.post({
        message: `Fauled to load entity kinds`,
        severity: 'error',
      });
    }
  }, [alertApi, error]);

  useEffect(() => {
    if (queryParamKind) {
      setSelectedKind(queryParamKind);
    }
  }, [queryParamKind]);

  useEffect(() => {
    if (filters.kind?.value) {
      setSelectedKind(filters.kind.value);
    }
  }, [filters.kind]);

  useEffect(() => {
    if (selectedKind !== filters.kind?.value) {
      updateFilters({
        kind: selectedKind ? new EntityKindFilter(selectedKind) : undefined,
      });
    }
  }, [filters, selectedKind, updateFilters]);

  if (error) return null;

  const items = kinds?.map(key => ({
    value: key.value.toLocaleLowerCase(),
    label: key.value,
  }));

  return hidden ? null : (
    <Box pb={1} pt={1}>
      <Select
        label="Kind"
        items={items}
        selected={selectedKind.toLocaleLowerCase()}
        onChange={value => setSelectedKind(String(value))}
      />
    </Box>
  );
};
