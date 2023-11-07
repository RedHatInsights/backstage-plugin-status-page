import {
  FormControl,
  IconButton,
  Input,
  InputAdornment,
  Toolbar,
  makeStyles,
} from '@material-ui/core';
import { usePaginatedEntityList } from '../contexts/PaginatedEntityListProvider';
import React, { useState } from 'react';
import { useDebounce } from 'react-use';
import Search from '@material-ui/icons/Search';
import Clear from '@material-ui/icons/Clear';
import { EntitySearchFilter } from '../utils/filters';

const useStyles = makeStyles(
  {
    searchToolbar: {
      paddingLeft: 0,
      paddingRight: 0,
    },
    input: {},
  },
  {
    name: 'CatalogReactEntitySearchBar',
  },
);

export const EntitySearchBar = () => {
  const classes = useStyles();

  const { filters, updateFilters } = usePaginatedEntityList();
  const [search, setSearch] = useState(filters.text?.value ?? '');

  useDebounce(
    () => {
      updateFilters({
        text: search.length ? new EntitySearchFilter(search) : undefined,
      });
    },
    250,
    [search, updateFilters],
  );

  return (
    <Toolbar className={classes.searchToolbar}>
      <FormControl>
        <Input
          aria-label="search"
          id="input-with-icon-adornment"
          className={classes.input}
          placeholder="Search"
          autoComplete="off"
          onChange={event => setSearch(event.target.value)}
          value={search}
          startAdornment={
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          }
          endAdornment={
            <InputAdornment position="end">
              <IconButton
                aria-label="clear search"
                onClick={() => setSearch('')}
                edge="end"
                disabled={search.length === 0}
              >
                <Clear />
              </IconButton>
            </InputAdornment>
          }
        />
      </FormControl>
    </Toolbar>
  );
};
