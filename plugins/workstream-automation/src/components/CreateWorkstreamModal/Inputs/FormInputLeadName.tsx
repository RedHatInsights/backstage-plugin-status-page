import { stringifyEntityRef, UserEntity } from '@backstage/catalog-model';
import { useApi } from '@backstage/core-plugin-api';
import {
  catalogApiRef,
  humanizeEntityRef,
} from '@backstage/plugin-catalog-react';
import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';
import React, { useEffect, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

export const FormInputLeadName = () => {
  const catalogApi = useApi(catalogApiRef);

  const [leadOptions, setLeadOptions] = useState<UserEntity[]>([]);
  const [leadName, setLeadName] = useState<string>();
  const [loading, setLoading] = useState(false);

  const { control } = useFormContext<{ lead: UserEntity | null }>();
  useEffect(() => {
    catalogApi
      .queryEntities({
        filter: { kind: 'User' },
        limit: 10,
        ...(leadName && {
          fullTextFilter: {
            term: leadName,
            fields: [
              'metadata.name',
              'metadata.title',
              'spec.profile.displayName',
            ],
          },
        }),
      })
      .then(res => {
        setLeadOptions(res.items as UserEntity[]);
        setLoading(false);
      });
  }, [catalogApi, leadName]);

  const handleInput = (val: string) => {
    if (val.trim().length > 1) {
      setLeadName(val);
      setLoading(true);
    } else setLeadName(undefined);
  };

  const getLeadOptionLabel = (leadOption: UserEntity) =>
    leadOption.spec.profile
      ? `${leadOption.spec.profile.displayName} (${leadOption.spec.profile.email})`
      : humanizeEntityRef(leadOption, {
          defaultKind: 'user',
          defaultNamespace: false,
        });

  return (
    <Controller
      name="lead"
      control={control}
      rules={{ required: 'Lead name is required' }}
      render={({
        field: { onChange, onBlur, value },
        fieldState: { error },
      }) => {
        return (
          <Autocomplete
            value={value ?? null}
            options={leadOptions}
            loading={loading}
            noOptionsText="No users found"
            getOptionSelected={(option, val) =>
              stringifyEntityRef(option) === stringifyEntityRef(val)
            }
            getOptionLabel={getLeadOptionLabel}
            onBlur={onBlur}
            onInputChange={(_e, val) => handleInput(val)}
            onChange={(_e, val) => onChange(val)}
            renderInput={params => (
              <TextField
                {...params}
                fullWidth
                label="Lead name"
                required
                error={!!error}
                helperText={error ? error.message : null}
                variant="outlined"
                placeholder="Enter lead name"
              />
            )}
          />
        );
      }}
    />
  );
};
