import { Link } from '@backstage/core-components';
import {
  configApiRef,
  useApi,
  useApp,
  useRouteRef,
} from '@backstage/core-plugin-api';
import { CatalogSearchResultListItem } from '@backstage/plugin-catalog';
import { searchPlugin } from '@backstage/plugin-search';
import { Result, SearchDocument } from '@backstage/plugin-search-common';
import {
  DefaultResultListItem,
  SearchContextProvider,
  SearchContextProviderProps,
  useSearch,
} from '@backstage/plugin-search-react';
import {
  Box,
  IconButton,
  InputAdornment,
  makeStyles,
  Paper,
  TextField,
  Typography,
} from '@material-ui/core';
import DefaultSearchIcon from '@material-ui/icons/Search';
import { Autocomplete } from '@material-ui/lab';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useDebounce from 'react-use/esm/useDebounce';

const useStyles = makeStyles(theme => ({
  root: {
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius * 5,
    paddingInline: '4px',
  },
}));

const SearchBar = () => {
  const classes = useStyles();
  const { setTerm, result } = useSearch();
  const [searchText, setSearchText] = useState('');
  const [options, setOptions] = useState<Result<SearchDocument>[]>([]);
  const [selectedOption, setSelectedOption] = useState<string>();

  useEffect(() => {
    if (result.value && result.value.results)
      setOptions(() => result.value?.results ?? []);
  }, [result]);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // ctrl+k (Windows/Linux) or meta+k (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useDebounce(
    () => {
      if (searchText.length > 0) setTerm(searchText);
    },
    400,
    [searchText],
  );

  const config = useApi(configApiRef);
  const SearchIcon = useApp().getSystemIcon('search') || DefaultSearchIcon;

  const navigate = useNavigate();
  const searchRoute = useRouteRef(searchPlugin.routes.root);

  return (
    <Autocomplete
      id="root-search-bar"
      freeSolo
      clearOnBlur
      blurOnSelect
      disableClearable
      openOnFocus
      value={selectedOption}
      inputValue={selectedOption}
      options={options}
      fullWidth
      filterOptions={x => x} // don't filter while typing
      getOptionSelected={(op, val) => {
        if (typeof val === 'string') return false;
        return op.document.location === val.document.location;
      }}
      // getOptionLabel={option => {
      //   if (typeof option === 'string') return option; // free solo typing
      //   return option.document.title;
      // }}
      onChange={(_e, val) => {
        if (val && typeof val === 'string') {
          navigate(`${searchRoute()}?query=${val.trim()}`);
        } else if (val && typeof val === 'object') {
          navigate(val.document.location);
        }
        setSelectedOption(() => searchText);
      }}
      onInputChange={(_e, val, reason) => {
        if (reason === 'input') setSearchText(() => val);
      }}
      PaperComponent={props => (
        <Paper
          {...props}
          onMouseDown={e => e.preventDefault()}
          style={{ paddingBottom: '16px', borderRadius: '16px' }}
        >
          {props.children}
          <Typography style={{ marginLeft: '25px' }} variant="subtitle1">
            Press{' '}
            <kbd
              style={{
                border: '1px solid',
                borderColor: 'rgba(0,0,0,0.23)',
                borderRadius: 4,
                padding: '2px 6px',
                fontSize: '0.8rem',
                fontFamily: 'monospace',
                background: 'rgba(0,0,0,0.04)',
              }}
            >
              Enter ⏎
            </kbd>{' '}
            to{' '}
            <Link
              to={`${searchRoute()}?query=${searchText}`}
              onClick={_e => {
                (document.activeElement as HTMLElement).blur();
                setSelectedOption(() => searchText);
              }}
            >
              view all {result.value?.numberOfResults} results
            </Link>
          </Typography>
        </Paper>
      )}
      renderOption={option => {
        switch (option.type) {
          case 'software-catalog':
            return (
              <CatalogSearchResultListItem
                key={option.document.location}
                result={option.document}
                highlight={option.highlight}
                rank={option.rank}
              />
            );
          default:
            return (
              <DefaultResultListItem
                key={option.document.location}
                result={option.document}
                highlight={option.highlight}
                rank={option.rank}
              />
            );
        }
      }}
      // size='small'
      renderInput={params => (
        <TextField
          {...params}
          inputRef={inputRef}
          variant="outlined"
          placeholder={`Search in ${
            config.getOptionalString('organization.name') ?? 'XE Compass'
          }`}
          inputProps={{
            ...params.inputProps,
            style: {
              paddingBlock: '12px',
            },
          }}
          InputProps={{ 
            ref: params.InputProps.ref,
            classes: { root: classes.root },
            startAdornment: (
              <InputAdornment position="start">
                <IconButton aria-label="Query" size="small" disabled>
                  <SearchIcon />
                </IconButton>
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <Box
                  sx={{
                    px: 1,
                    py: 0.25,
                    marginX: '4px',
                    borderRadius: '8px',
                    bgcolor: 'action.hover',
                    fontSize: '0.9rem',
                    fontFamily: 'monospace',
                    color: 'text.secondary',
                  }}
                >
                  Ctrl + K / ⌘ + K
                </Box>
              </InputAdornment>
            ),
            type: 'search',
          }}
        />
      )}
    />
  );
};

/** @public */
export const CustomSearchBar = (props: SearchContextProviderProps) => {
  return (
    <SearchContextProvider {...props}>
      <Box
        sx={{
          position: 'relative',
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'start',
        }}
      >
        <SearchBar />
      </Box>
    </SearchContextProvider>
  );
};
