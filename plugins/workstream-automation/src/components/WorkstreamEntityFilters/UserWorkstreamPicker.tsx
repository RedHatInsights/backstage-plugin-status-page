import { useApi } from '@backstage/core-plugin-api';
import {
  catalogApiRef,
  DefaultEntityFilters,
  EntityDisplayName,
  EntityFilter,
  useEntityList,
} from '@backstage/plugin-catalog-react';
import Box from '@material-ui/core/Box';
import TextField, { TextFieldProps } from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Autocomplete from '@material-ui/lab/Autocomplete';

import { Chip } from '@material-ui/core';
import { useEffect, useMemo, useState } from 'react';
import useAsync from 'react-use/esm/useAsync';
import { PickerOption } from './components/PickerOption';
import { ExtendedFilters, UserWorkstreamFilter } from './filters';

type PickerProps = {
  label: string;
  name: keyof ExtendedFilters;
  path: string;
  Filter: new (values: string[]) => EntityFilter;
  showCounts?: boolean;
  InputProps?: TextFieldProps;
  initialSelectedOptions?: string[];
  filtersForAvailableValues?: Array<keyof DefaultEntityFilters>;
  isEntityRef?: boolean;
};

const AutocompletePicker = (props: PickerProps) => {
  const {
    label,
    name,
    path,
    Filter,
    showCounts,
    InputProps,
    initialSelectedOptions = [],
    isEntityRef = false,
  } = props;

  const {
    updateFilters,
    filters,
    queryParameters: { [name]: queryParameter },
  } = useEntityList<ExtendedFilters>();

  const catalogApi = useApi(catalogApiRef);
  const { value: availableValues } = useAsync(async () => {
    const facet = path; // relations.memberOf
    const { facets } = await catalogApi.getEntityFacets({
      facets: [facet],
      filter: [{ kind: ['User'] }],
    });

    return Object.fromEntries(
      facets[facet]
        .filter(({ value }) => value.startsWith('workstream:'))
        .map(({ value, count }) => [value, count]),
    );
  });

  const queryParameters = useMemo(
    () => [queryParameter].flat().filter(Boolean) as string[],
    [queryParameter],
  );

  const [selectedOptions, setSelectedOptions] = useState(
    queryParameters.length
      ? queryParameters
      : (filters[name] as unknown as { values: string[] })?.values ??
          initialSelectedOptions,
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

  const filter = filters[name];

  if (
    (filter && typeof filter === 'object' && !('values' in filter)) ||
    !availableOptions.length
  ) {
    return null;
  }

  return filters.kind?.value === 'user' ? (
    <Box pb={1} pt={1}>
      <Typography variant="button" component="label">
        {label}
        <Autocomplete<string, true>
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
  ) : null;
};

export const UserWorkstreamPicker = () => {
  return (
    <AutocompletePicker
      name="workstream"
      label="Workstreams"
      path="relations.memberOf"
      Filter={UserWorkstreamFilter}
      isEntityRef
    />
  );
};
