import React, { useEffect } from 'react';
import { CatalogItem } from './CatalogItem';
import {
  Box,
  Button,
  List,
  Paper,
  TablePagination,
  makeStyles,
} from '@material-ui/core';
import { EmptyState, Link, Progress } from '@backstage/core-components';
import { CatalogToolbar } from './CatalogToolbar';
import { usePaginatedEntityList } from '../contexts/PaginatedEntityListProvider';
import { plural } from 'pluralize';
import { alertApiRef, useApi } from '@backstage/core-plugin-api';

const useStyles = makeStyles(theme => ({
  list: {
    '&>*:nth-child(even)': {
      backgroundColor: theme.palette.background.default,
    },
  },
}));

interface CatalogListProps {
  dispatchActiveKind?: (values: {
    kind: string | symbol | (string | symbol)[];
    count: number;
  }) => void;
}

export const CatalogList = ({ dispatchActiveKind }: CatalogListProps) => {
  const { list } = useStyles();
  const alertApi = useApi(alertApiRef);

  const {
    loading,
    error,
    entities,
    filters,
    totalCount,
    pageOptions,
    updatePageOptions,
  } = usePaginatedEntityList();

  useEffect(() => {
    if (filters.kind?.value) {
      dispatchActiveKind?.({
        kind: filters.kind.value,
        count: totalCount,
      });
    }
  }, [dispatchActiveKind, entities, filters, totalCount]);

  /* Updates the query params after a page change */
  const handleChangePage = (
    _: React.MouseEvent<HTMLButtonElement, MouseEvent> | null,
    newPage: number,
  ) => {
    updatePageOptions({ ...pageOptions, page: newPage });
  };

  /* Updates the query params after a rowsPerPage change */
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    updatePageOptions({
      rowsPerPage: parseInt(event.target.value ?? '10', 10),
      page: 0,
    });
  };

  useEffect(() => {
    if (error) {
      alertApi.post({
        message: 'Failed to load entities. Please try again.',
        severity: 'error'
      });
    }
  }, [alertApi, error]);


  const EntitiesList = () => {
    if (!entities?.length) {
      return (
        <Paper variant="outlined">
          <EmptyState
            missing="data"
            title={`No ${plural(filters.kind?.value.toString())} found.`}
            description="No records found for the entered filters."
            action={
              <Button
                color="primary"
                variant="outlined"
                component={(props: any) => <Link {...props} to="/" />}
              >
                Go to home
              </Button>
            }
          />
        </Paper>
      );
    }

    return (
      <Paper>
        <List className={list}>
          {entities.map((entity, index) => (
            <CatalogItem key={index} entity={entity} />
          ))}
        </List>
      </Paper>
    );
  };

  const Pagination = () => (
    <>
      {!loading && entities.length > 0 && (
        <TablePagination
          component="div"
          count={totalCount}
          page={pageOptions.page}
          onPageChange={handleChangePage}
          rowsPerPage={pageOptions.rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Rows:"
        />
      )}
    </>
  );

  return (
    <>
      <CatalogToolbar>
        <Box alignSelf="flex-end" flexGrow={1} marginBottom={2}>
          <Pagination />
        </Box>
      </CatalogToolbar>
      {loading && <Progress />}
      {!loading && <EntitiesList />}
      <Box marginTop={1}>
        <Pagination />
      </Box>
    </>
  );
};
