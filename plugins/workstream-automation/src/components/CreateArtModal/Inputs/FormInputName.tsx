import { ArtEntity } from '@appdev-platform/backstage-plugin-workstream-automation-common';
import { useApi } from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { kebabCase } from 'lodash';
import { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useDebounce } from 'react-use';

export const FormInputName = (props: { currentEntity?: ArtEntity }) => {
  const { currentEntity } = props;
  const catalogApi = useApi(catalogApiRef);
  const { control } = useFormContext<{ artName: string }>();

  const [loading, setLoading] = useState(false);
  const [artName, setArtName] = useState('');
  const [options, setOptions] = useState<string[]>([]);

  const handleNameChange = async (
    _event: React.ChangeEvent<{}>,
    value: string,
  ) => {
    if (value.length > 2) {
      setLoading(true);
      setArtName(value);
    }
  };

  useDebounce(
    () => {
      if (artName.length > 2) {
        catalogApi
          .queryEntities({
            filter: {
              kind: 'ART',
            },
            fullTextFilter: {
              term: artName,
              fields: ['metadata.name', 'metadata.title'],
            },
            fields: ['metadata.title', 'metadata.name'],
          })
          .then(entityResponse => {
            if (entityResponse.items.length > 0)
              setOptions(
                entityResponse.items.map(
                  entity => entity.metadata.title ?? entity.metadata.name,
                ),
              );
            else setOptions([]);
          })
          .finally(() => setLoading(false));
      }
    },
    400,
    [artName, setLoading],
  );
  return (
    <Controller
      name="artName"
      control={control}
      rules={{
        required: 'ART name is required',
        validate: val => {
          for (const option of options) {
            if (
              kebabCase(option) === kebabCase(currentEntity?.metadata.name) ||
              kebabCase(option) === kebabCase(currentEntity?.metadata.title)
            )
              return true;
            if (kebabCase(option) === kebabCase(val.trim()))
              return 'Cannot use an already available ART name';
          }
          return true;
        },
      }}
      render={({ field, fieldState: { error } }) => {
        const { onChange, value, ref, onBlur } = field;
        return (
          <Autocomplete
            freeSolo
            value={value ?? null}
            options={options}
            groupBy={() => 'Available ARTs'}
            onBlur={onBlur}
            loading={loading}
            onInputChange={(e, val) => {
              onChange(val);
              handleNameChange(e, val);
            }}
            renderInput={params => (
              <TextField
                {...params}
                inputRef={ref}
                label="ART Name"
                variant="outlined"
                required
                error={!!error}
                helperText={error ? error.message : null}
              />
            )}
          />
        );
      }}
    />
  );
};
