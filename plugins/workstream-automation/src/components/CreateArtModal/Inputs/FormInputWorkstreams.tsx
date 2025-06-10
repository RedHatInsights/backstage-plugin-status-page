import { WorkstreamEntity } from '@appdev-platform/backstage-plugin-workstream-automation-common';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { useApi } from '@backstage/core-plugin-api';
import {
  catalogApiRef,
  EntityDisplayName,
} from '@backstage/plugin-catalog-react';
import { Checkbox, TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import React, { useEffect, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useDebounce } from 'react-use';

export const FormInputWorkstreams = () => {
  const catalogApi = useApi(catalogApiRef);
  const [workstreamOptions, setWorkstreamOptions] = useState<
    WorkstreamEntity[]
  >([]);
  const [searchText, setSearchText] = useState<string>();

  const { control } = useFormContext<{
    workstreams: WorkstreamEntity[];
  }>();

  useEffect(() => {
    catalogApi
      .queryEntities({ filter: [{ kind: ['Workstream'] }], limit: 10 })
      .then(res => setWorkstreamOptions(res.items as WorkstreamEntity[]));
  }, [catalogApi]);

  useDebounce(
    () => {
      if (searchText) {
        catalogApi
          .queryEntities({
            limit: 20,
            filter: [{ kind: ['Workstream'] }],
            fullTextFilter: {
              term: searchText,
              fields: ['metadata.name', 'metadata.title'],
            },
          })
          .then(res => setWorkstreamOptions(res.items as WorkstreamEntity[]));
      }
    },
    400,
    [searchText],
  );

  return (
    <Controller
      name="workstreams"
      control={control}
      render={({ field: { onBlur, onChange, value } }) => {
        return (
          <Autocomplete
            multiple
            disableCloseOnSelect
            options={workstreamOptions}
            getOptionSelected={(option, val) =>
              stringifyEntityRef(option) === stringifyEntityRef(val)
            }
            groupBy={option => option.kind}
            getOptionLabel={option => {
              return stringifyEntityRef(option);
            }}
            renderOption={(option, { selected }) => {
              return (
                <>
                  <Checkbox checked={selected} />
                  <EntityDisplayName entityRef={option} disableTooltip />
                </>
              );
            }}
            onBlur={onBlur}
            onChange={(_e, val) => onChange(val)}
            onInputChange={(_, val) => {
              if (val.length > 2) setSearchText(val);
            }}
            value={value}
            renderInput={params => (
              <TextField
                {...params}
                variant="outlined"
                fullWidth
                label="Add workstreams"
                placeholder="Select from list"
                helperText="Optional can be added later"
              />
            )}
          />
        );
      }}
    />
  );
};
