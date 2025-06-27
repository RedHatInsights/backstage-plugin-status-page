import { stringifyEntityRef, UserEntity } from '@backstage/catalog-model';
import { useApi } from '@backstage/core-plugin-api';
import {
  catalogApiRef,
  humanizeEntityRef,
} from '@backstage/plugin-catalog-react';
import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { useEffect, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useDebounce } from 'react-use';
import { Member } from '../../../types';
import { Box, Typography } from '@material-ui/core';

export const FormInputRteName = (props: { members?: Member[] }) => {
  const { members = [] } = props;
  const catalogApi = useApi(catalogApiRef);
  const { control } = useFormContext<{
    rte: UserEntity | null;
  }>();

  const [rteOptions, setRteOptions] = useState<UserEntity[]>([]);
  const [rteName, setRteName] = useState<string>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    catalogApi
      .queryEntities({
        filter: { kind: 'User' },
        limit: 10,
      })
      .then(res => {
        setRteOptions(res.items as UserEntity[]);
      });
  }, [catalogApi]);

  useDebounce(
    async () => {
      if (loading && rteName) {
        const res = await catalogApi.queryEntities({
          filter: { kind: 'User' },
          limit: 10,
          ...(rteName && {
            fullTextFilter: {
              term: rteName,
              fields: [
                'metadata.name',
                'metadata.title',
                'spec.profile.displayName', // This field filter does not work
              ],
            },
          }),
        });
        setRteOptions(res.items as UserEntity[]);
        setLoading(false);
      }
    },
    400,
    [rteName],
  );

  const handleInput = (val: string) => {
    if (val.trim().length > 1) {
      setRteName(val);
      setLoading(true);
    } else setRteName(undefined);
  };

  const isDisabledOption = (option: UserEntity) =>
    members.some(member => member.userRef === stringifyEntityRef(option))
      ? true
      : false;

  const getRteOptionLabel = (rteOption: UserEntity) =>
    rteOption.spec.profile
      ? `${rteOption.spec.profile.displayName} (${rteOption.spec.profile.email})`
      : humanizeEntityRef(rteOption, {
          defaultKind: 'user',
          defaultNamespace: false,
        });

  return (
    <Controller
      name="rte"
      control={control}
      render={({
        field: { onChange, onBlur, value },
        fieldState: { error },
      }) => {
        return (
          <Autocomplete
            value={value ?? null}
            options={rteOptions}
            loading={loading}
            noOptionsText="No users found (enter correct uid)"
            getOptionSelected={(option, val) =>
              stringifyEntityRef(option) === stringifyEntityRef(val)
            }
            getOptionLabel={getRteOptionLabel}
            onBlur={onBlur}
            onInputChange={(_e, val) => {
              if (
                (value && getRteOptionLabel(value) === val) ||
                rteOptions.some(p => getRteOptionLabel(p) === val)
              )
                return;
              handleInput(val);
            }}
            getOptionDisabled={isDisabledOption}
            renderOption={option => {
              const member = members.find(
                m => m.userRef === stringifyEntityRef(option),
              );
              return (
                <Box display="flex" width="100%" justifyContent="space-between">
                  {getRteOptionLabel(option)}
                  {member && (
                    <Typography
                      style={{ fontStyle: 'italic' }}
                      variant="subtitle1"
                    >
                      Added as {member?.role}
                    </Typography>
                  )}
                </Box>
              );
            }}
            onChange={(_e, val) => onChange(val)}
            renderInput={params => (
              <TextField
                {...params}
                fullWidth
                label="RTE name"
                error={!!error}
                helperText={error ? error.message : null}
                variant="outlined"
                placeholder="Enter release train engineer name"
              />
            )}
          />
        );
      }}
    />
  );
};
