import { WorkstreamEntity } from '@appdev-platform/backstage-plugin-workstream-automation-common';
import { useApi, useRouteRef } from '@backstage/core-plugin-api';
import { catalogApiRef, entityRouteRef } from '@backstage/plugin-catalog-react';
import {
  Checkbox,
  CircularProgress,
  FormControlLabel,
  InputAdornment,
  TextField,
} from '@material-ui/core';
import { Alert, AlertTitle } from '@material-ui/lab';
import { kebabCase } from 'lodash';
import React, { useEffect, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useDebounce } from 'react-use';
import { Form } from './type';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';

export const FormInputPath = (props: {
  currentWorkstreamName?: string;
  entity: WorkstreamEntity;
}) => {
  const { entity, currentWorkstreamName } = props;

  const { control, watch, setValue } = useFormContext<Form>();

  const watchWorkstreamName = watch('workstreamName');
  const [searchText, setSearchText] = useState<string>();
  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isChecked) {
      setValue('workstreamPath', kebabCase(currentWorkstreamName));
      return;
    }
    if (kebabCase(watchWorkstreamName) !== kebabCase(entity.metadata.title)) {
      setValue('workstreamPath', kebabCase(watchWorkstreamName));
      setSearchText(kebabCase(watchWorkstreamName));
      setIsLoading(true);
    } else setValue('workstreamPath', kebabCase(currentWorkstreamName));
  }, [watchWorkstreamName, setValue, entity, currentWorkstreamName, isChecked]);

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

  return kebabCase(watchWorkstreamName) !== kebabCase(entity.metadata.title) ? (
    <Controller
      control={control}
      name="workstreamPath"
      rules={{
        validate: () => !error,
      }}
      defaultValue={entity.metadata.name}
      render={({ field: { value, onChange } }) => {
        return (
          <>
            <FormControlLabel
              control={
                <Checkbox
                  color="primary"
                  checked={isChecked}
                  onChange={(_e, checked) => {
                    setIsChecked(checked);
                    setIsLoading(true);
                    setSearchText(kebabCase(currentWorkstreamName));
                  }}
                />
              }
              label="Change workstream path"
            />
            <TextField
              variant="outlined"
              disabled={!isChecked}
              label="Path"
              fullWidth
              error={!!error}
              FormHelperTextProps={{
                style: {
                  margin: '8px 0 0 0',
                },
              }}
              onChange={e => {
                const newPath = e.target.value;
                if (newPath.length > 0 && isChecked) {
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
            {isChecked && (
              <Alert
                severity={error ? 'error' : 'success'}
                variant="standard"
                icon={<ErrorOutlineIcon />}
              >
                <AlertTitle>Workstream name: {watchWorkstreamName}</AlertTitle>
                <code>
                  Path:&nbsp;
                  {entityRoute({
                    name: kebabCase(value),
                    kind: entity.kind,
                    namespace: entity.metadata.namespace,
                  })}
                  &nbsp;is {error ? 'not' : ''} available
                </code>
              </Alert>
            )}
          </>
        );
      }}
    />
  ) : null;
};
