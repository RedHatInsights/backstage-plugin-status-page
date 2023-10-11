import React, { useEffect } from 'react';
import { Box } from '@material-ui/core';
import { Select } from '@backstage/core-components';
import { alertApiRef, useApi } from '@backstage/core-plugin-api';
import { capitalize } from 'lodash';
import { useEntityTypeFilter } from '../hooks/useEntityTypes';

export const EntityTypePicker = (props: { hidden?: boolean, initialFilter?: string }) => {
  const { hidden, initialFilter } = props;

  const alertApi = useApi(alertApiRef);

  const { error, availableTypes, selectedTypes, setSelectedTypes } = useEntityTypeFilter();
  
  useEffect(() => {
    if (error) {
      alertApi.post({
        message: `Fauled to load entity kinds`,
        severity: 'error'
      });
    }
    if (initialFilter) {
      setSelectedTypes([initialFilter]);
    }
  }, [alertApi, error, initialFilter, setSelectedTypes]);

  if (availableTypes.length === 0 || error) return null;

  const items = [
    { value: 'all', label: 'All' },
    ...availableTypes.map(type => ({
      value: type,
      label: capitalize(type),
    })),
  ];

  return hidden ? null : (
    <Box pb={1} pt={1}>
      <Select
        label="Type"
        items={items}
        selected={(items.length > 1 ? selectedTypes[0] : undefined) ?? 'all'}
        onChange={value => setSelectedTypes(value === 'all' ? [] : [String(value)])}
      />
    </Box>
  );
};
