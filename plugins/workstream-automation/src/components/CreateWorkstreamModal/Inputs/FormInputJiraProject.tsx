import { discoveryApiRef, useApi } from '@backstage/core-plugin-api';
import { TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import React, { useEffect, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

export const FormInputJiraProject = () => {
  const discoveryApi = useApi(discoveryApiRef);
  const [jiraOptions, setJiraOptions] = useState<any[]>([]);

  const { control } = useFormContext<{ jiraProject: any | string | null }>();
  useEffect(() => {
    discoveryApi.getBaseUrl('proxy').then(url => {
      const base = `${url}/jira/rest/api/2/project`;
      fetch(base).then(res =>
        res.json().then(val => {
          setJiraOptions(val);
        }),
      );
    });
  }, [discoveryApi]);
  return (
    <Controller
      name="jiraProject"
      control={control}
      rules={{ required: 'jira peoject is required' }}
      render={({
        field: { onChange, onBlur, value },
        fieldState: { error },
      }) => {
        return (
          <Autocomplete
            value={value ?? null}
            options={jiraOptions}
            getOptionSelected={(option, val) => option.key === val.key}
            getOptionLabel={o => `${o.name?.trim()} (${o.key})`}
            onBlur={onBlur}
            onChange={(_e, val) => onChange(val)}
            renderInput={params => (
              <TextField
                {...params}
                fullWidth
                label="Select Jira Project"
                required
                error={!!error}
                helperText={error ? error.message : null}
                variant="outlined"
                placeholder="Select one"
              />
            )}
          />
        );
      }}
    />
  );
};
