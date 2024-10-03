import {
  parseEntityRef,
  stringifyEntityRef,
  UserEntity,
} from '@backstage/catalog-model';
import { useApi } from '@backstage/core-plugin-api';
import {
  catalogApiRef,
  humanizeEntityRef,
} from '@backstage/plugin-catalog-react';
import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';
import React, { useEffect, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useDebounce } from 'react-use';

export const FormInputLeadName = () => {
  const catalogApi = useApi(catalogApiRef);
  const { control } = useFormContext<{
    lead: UserEntity | null;
  }>();

  const [leadOptions, setLeadOptions] = useState<UserEntity[]>([]);
  const [leadName, setLeadName] = useState<string>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    catalogApi
      .queryEntities({
        filter: { kind: 'User' },
        limit: 10,
        ...(leadName && {
          fullTextFilter: {
            term: leadName,
            fields: ['metadata.name', 'metadata.title'],
          },
        }),
      })
      .then(res => {
        setLeadOptions(res.items as UserEntity[]);
      });
  }, [catalogApi, leadName]);

  useDebounce(
    async () => {
      if (loading && leadName) {
        const res = await catalogApi.getEntityByRef(
          parseEntityRef(leadName, {
            defaultKind: 'user',
            defaultNamespace: 'redhat',
          }),
        );
        if (res) setLeadOptions([res as UserEntity]);
        setLoading(false);
      }
    },
    400,
    [leadName],
  );

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
      render={({
        field: { onChange, onBlur, value },
        fieldState: { error },
      }) => {
        return (
          <Autocomplete
            value={value ?? null}
            options={leadOptions}
            loading={loading}
            noOptionsText="No users found (enter correct uid)"
            getOptionSelected={(option, val) =>
              stringifyEntityRef(option) === stringifyEntityRef(val)
            }
            getOptionLabel={getLeadOptionLabel}
            onBlur={onBlur}
            onInputChange={(_e, val) => {
              if (
                (value && getLeadOptionLabel(value) === val) ||
                leadOptions.some(p => getLeadOptionLabel(p) === val)
              )
                return;
              handleInput(val);
            }}
            onChange={(_e, val) => onChange(val)}
            renderInput={params => (
              <TextField
                {...params}
                fullWidth
                label="Lead name"
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
