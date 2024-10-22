import { WorkstreamDataV1alpha1 } from '@appdev-platform/backstage-plugin-workstream-automation-common';
import { useApi, useRouteRef } from '@backstage/core-plugin-api';
import { catalogApiRef, entityRouteRef } from '@backstage/plugin-catalog-react';
import { CircularProgress, InputAdornment, TextField } from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { kebabCase } from 'lodash';
import React, { useEffect, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useDebounce } from 'react-use';
import { Form } from './type';

export const FormInputPath = (props: {
  currentWorkstreamName?: string;
  entity: WorkstreamDataV1alpha1;
}) => {
  const { entity } = props;

  const { control, watch, setValue, resetField } = useFormContext<Form>();

  const watchWorkstreamName = kebabCase(watch('workstreamName'));
  const [searchText, setSearchText] = useState<string>();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (watchWorkstreamName !== kebabCase(entity.metadata.title)) {
      setValue('workstreamPath', watchWorkstreamName);
      setSearchText(watchWorkstreamName);
      setIsLoading(true);
    } else resetField('workstreamPath');
  }, [watchWorkstreamName, setValue, entity, resetField]);

  const catalogApi = useApi(catalogApiRef);
  const entityRoute = useRouteRef(entityRouteRef);
  const [error, setError] = useState(false);

  useDebounce(
    () => {
      if (isLoading) {
        if (searchText && searchText === entity.metadata.name) {
          setError(false);
          setIsLoading(false);
        } else if (searchText) {
          catalogApi
            .getEntityByRef({
              name: searchText,
              kind: entity.kind,
              namespace: entity.metadata.namespace,
            })
            .then(val =>
              val !== undefined ? setError(true) : setError(false),
            );
          setIsLoading(false);
        }
      }
    },
    400,
    [searchText, isLoading],
  );

  return (
    <Controller
      control={control}
      name="workstreamPath"
      rules={{
        validate: () => !error,
      }}
      defaultValue={entity.metadata.name}
      render={({ field: { value, onChange } }) => {
        return (
          <TextField
            variant="outlined"
            label="Path"
            fullWidth
            error={!!error}
            FormHelperTextProps={{
              style: {
                margin: '8px 0 0 0',
              },
            }}
            helperText={
              <Alert severity={error ? 'error' : 'success'} variant="standard">
                Path:&nbsp;
                {entityRoute({
                  name: kebabCase(value),
                  kind: entity.kind,
                  namespace: entity.metadata.namespace,
                })}
                &nbsp;is {error ? 'not' : ''} available
              </Alert>
            }
            onChange={e => {
              const newPath = e.target.value;
              if (newPath.length > 0) {
                setIsLoading(true);
                setSearchText(kebabCase(newPath));
              }
              onChange(newPath);
            }}
            value={value}
            {...(isLoading && {
              InputProps: {
                endAdornment: (
                  <InputAdornment position="end">
                    <CircularProgress
                      style={{ height: '30px', width: '30px' }}
                    />
                  </InputAdornment>
                ),
              },
            })}
          />
        );
      }}
    />
  );
};
