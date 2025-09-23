import { useApi } from '@backstage/core-plugin-api';
import {
  catalogApiRef,
  EntityDisplayName,
  EntityFilter,
  useEntityList,
} from '@backstage/plugin-catalog-react';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import Autocomplete from '@material-ui/lab/Autocomplete';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import TextField, { TextFieldProps } from '@material-ui/core/TextField';

import { useEffect, useMemo, useState } from 'react';
import useAsync from 'react-use/esm/useAsync';
import { PickerOption } from './components/PickerOption';
import { Chip } from '@material-ui/core';
import { ExtendedFilters } from './filters';
import { isEqual } from 'lodash';

export type PickerProps = {
  label: string;
  name: keyof ExtendedFilters;
  path: string;
  Filter: new (values: string[]) => EntityFilter;
  showCounts?: boolean;
  InputProps?: TextFieldProps;
  initialSelectedOptions?: string[];
  filtersForAvailableValues?: Array<keyof ExtendedFilters>;
  isEntityRef?: boolean;
};

export const AutocompletePicker = (props: PickerProps) => {
  const {
    label,
    name,
    path,
    Filter,
    showCounts,
    InputProps,
    initialSelectedOptions = [],
    filtersForAvailableValues = ['kind'],
    isEntityRef = false,
  } = props;

  const {
    updateFilters,
    filters,
    queryParameters: { [name]: queryParameter },
  } = useEntityList<ExtendedFilters>();

  const catalogApi = useApi(catalogApiRef);
  const availableValuesFilters = filtersForAvailableValues.map(
    f => filters[f] as EntityFilter | undefined,
  );

  const { value: availableValues } = useAsync(async () => {
    const facet = path;
    const { facets } = await catalogApi.getEntityFacets({
      facets: [facet],
      filter: availableValuesFilters.reduce((prevVal, curr) => {
        return {
          ...prevVal,
          ...(curr && curr.getCatalogFilters ? curr.getCatalogFilters() : {}),
        };
      }, {} as Record<string, string | symbol | (string | symbol)[]>),
    });
    return Object.fromEntries(
      facets[facet].map(({ value, count }) => [value, count]),
    );
  }, [...availableValuesFilters]);

  const queryParameters = useMemo(
    () => [queryParameter].flat().filter(Boolean) as string[],
    [queryParameter],
  );

  const filteredOptions = (filters[name] as unknown as { values: string[] })
    ?.values;

  const [selectedOptions, setSelectedOptions] = useState(
    queryParameters.length
      ? queryParameters
      : filteredOptions ?? initialSelectedOptions,
  );

  // Set selected options on query parameter updates; this happens at initial page load and from
  // external updates to the page location
  useEffect(() => {
    if (queryParameters.length) {
      setSelectedOptions(queryParameters);
    }
  }, [queryParameters]);

  const availableOptions = Object.keys(availableValues ?? {});
  const shouldAddFilter = selectedOptions.length && availableOptions.length;

  useEffect(() => {
    updateFilters({
      [name]: shouldAddFilter ? new Filter(selectedOptions) : undefined,
    });
  }, [name, shouldAddFilter, selectedOptions, updateFilters, Filter]);

  useEffect(() => {
    if (!shouldAddFilter) return;
    const newSelectedOptions = filteredOptions ?? [];
    if (!isEqual(newSelectedOptions, selectedOptions)) {
      setSelectedOptions(newSelectedOptions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Don't re-set filter value when selectedOptions changes
  }, [filteredOptions]);

  // Remove any previously selected options that are no longer available in the current context
  useEffect(() => {
    if (availableOptions.length && selectedOptions.length) {
      const validSelected = selectedOptions.filter(option =>
        availableOptions.includes(option),
      );
      if (!isEqual(validSelected, selectedOptions)) {
        setSelectedOptions(validSelected);
      }
    }
  }, [availableOptions, selectedOptions]);

  const filter = filters[name];

  if (
    (filter && typeof filter === 'object' && !('values' in filter)) ||
    !availableOptions.length
  ) {
    return null;
  }

  return (
    <Box pb={1} pt={1}>
      <Typography
        variant="button"
        style={{ fontWeight: 'bold', textTransform: 'none' }}
        component="label"
      >
        {label}
        <Typography/>
        <Autocomplete<string, true>
          // PopperComponent={popperProps => (
          //   <div {...popperProps}>{popperProps.children as ReactNode}</div>
          // )}
          multiple
          disableCloseOnSelect
          options={availableOptions}
          value={selectedOptions}
          onChange={(_event: object, options: string[]) =>
            setSelectedOptions(options)
          }
          renderTags={(val, getTagProps) => {
            return val.map((v, index) => (
              <Chip
                key={v}
                {...getTagProps({ index })}
                size="small"
                label={
                  isEntityRef ? <EntityDisplayName hideIcon entityRef={v} /> : v
                }
              />
            ));
          }}
          renderOption={(option, { selected }) => (
            <PickerOption
              selected={selected}
              value={option}
              availableOptions={availableValues}
              showCounts={!!showCounts}
              isEnitityRef={isEntityRef}
            />
          )}
          size="small"
          popupIcon={
            <ExpandMoreIcon data-testid={`${String(name)}-picker-expand`} />
          }
          renderInput={params => (
            <TextField {...params} {...InputProps} variant="outlined" />
          )}
        />
      </Typography>
    </Box>
  );
};
