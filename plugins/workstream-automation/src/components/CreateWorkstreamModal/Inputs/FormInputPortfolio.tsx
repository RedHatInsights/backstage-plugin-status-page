import { stringifyEntityRef, SystemEntity } from '@backstage/catalog-model';
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

export const FormInputPortfolio = () => {
  const catalogApi = useApi(catalogApiRef);
  const [portfolioOptions, setPortfolioOptions] = useState<SystemEntity[]>([]);
  const [searchText, setSearchText] = useState<string>();

  const { control } = useFormContext<{ portfolio: SystemEntity[] }>();

  useEffect(() => {
    catalogApi
      .queryEntities({ filter: { kind: 'System' }, limit: 20 })
      .then(res => setPortfolioOptions(res.items as SystemEntity[]));
  }, [catalogApi]);

  useDebounce(
    () => {
      if (searchText) {
        catalogApi
          .queryEntities({
            limit: 20,
            filter: { kind: 'System' },
            fullTextFilter: {
              term: searchText,
              fields: ['metadata.name', 'metadata.title'],
            },
          })
          .then(res => setPortfolioOptions(res.items as SystemEntity[]));
      }
    },
    400,
    [searchText],
  );

  return (
    <Controller
      name="portfolio"
      control={control}
      render={({ field: { onBlur, onChange, value } }) => {
        return (
          <Autocomplete
            multiple
            options={portfolioOptions}
            getOptionSelected={(option, val) =>
              stringifyEntityRef(option) === stringifyEntityRef(val)
            }
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
                label="Add portfolio"
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
