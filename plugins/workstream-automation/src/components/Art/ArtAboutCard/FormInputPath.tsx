import { ArtEntity } from '@compass/backstage-plugin-workstream-automation-common';
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
import { useEffect, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useDebounce } from 'react-use';
import { Form } from './types';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';

export const FormInputPath = (props: {
  currentArtName?: string;
  entity: ArtEntity;
}) => {
  const { entity, currentArtName } = props;

  const { control, watch, setValue } = useFormContext<Form>();

  const watchArtName = watch('artName');
  const [searchText, setSearchText] = useState<string>();
  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isChecked) {
      setValue('artPath', kebabCase(currentArtName));
      return;
    }
    if (kebabCase(watchArtName) !== kebabCase(entity.metadata.title)) {
      setValue('artPath', kebabCase(watchArtName));
      setSearchText(kebabCase(watchArtName));
      setIsLoading(true);
    } else setValue('artPath', kebabCase(currentArtName));
  }, [watchArtName, setValue, entity, currentArtName, isChecked]);

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

  return kebabCase(watchArtName) !== kebabCase(entity.metadata.title) ? (
    <Controller
      control={control}
      name="artPath"
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
                    setSearchText(kebabCase(currentArtName));
                  }}
                />
              }
              label="Change ART path"
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
                <AlertTitle>ART name: {watchArtName}</AlertTitle>
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
