import React, { useEffect, useMemo } from 'react';
import { CatalogItem } from './CatalogItem';
import {
  Box,
  Button,
  List,
  Paper,
  TablePagination,
  makeStyles,
} from '@material-ui/core';
import { useEntityList } from '@backstage/plugin-catalog-react';
import {
  EmptyState,
  Link,
  Progress,
  useQueryParamState,
} from '@backstage/core-components';
import { CatalogToolbar } from './CatalogToolbar';

const useStyles = makeStyles(theme => ({
  list: {
    '&>*:nth-child(even)': {
      backgroundColor: theme.palette.background.default,
    },
  },
}));

interface CatalogListProps {
  dispatchActiveKind?: (values: { kind: string; count: number }) => void;
}

export const CatalogList = ({ dispatchActiveKind }: CatalogListProps) => {
  const { loading, error, entities, filters } = useEntityList();
  const { list } = useStyles();

  const [pageQs, setPageQs] = useQueryParamState<string>('page');
  const [rowsPerPageQs, setRowsPerPageQs] =
    useQueryParamState<string>('rowsPerPage');
  const defaultRowsPerPage = '10';

  const page = useMemo(() => Number.parseInt(pageQs ?? '1', 10), [pageQs]);
  const rowsPerPage = useMemo(
    () => Number.parseInt(rowsPerPageQs ?? defaultRowsPerPage, 10),
    [rowsPerPageQs],
  );

  useEffect(() => {
    if (filters.kind?.value) {
      dispatchActiveKind?.({
        kind: filters.kind?.value,
        count: entities.length,
      });
    }
  }, [dispatchActiveKind, entities, filters]);

  /* Updates the query params after a page change */
  const handleChangePage = (
    _: React.MouseEvent<HTMLButtonElement, MouseEvent> | null,
    newPage: number,
  ) => {
    setPageQs(newPage.toString());
  };

  /* Updates the query params after a rowsPerPage change */
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setRowsPerPageQs(event.target.value);
    setPageQs('1');
  };

  const EntitiesList = () => {
    if (entities.length === 0) {
      return (
        <Paper variant="outlined">
          <EmptyState
            missing="data"
            title={`No ${filters.kind?.value}s found.`}
            description="No records found for the entered filters."
            action={
              <Button
                color="primary"
                variant="outlined"
                component={props => <Link {...props} to="/" />}
              >
                Go to home
              </Button>
            }
          />
        </Paper>
      );
    }
    const startIndex = rowsPerPage * (page - 1);
    const endIndex = rowsPerPage * page;

    return (
      <Paper>
        <List className={list}>
          {entities.slice(startIndex, endIndex).map(entity => (
            <CatalogItem key={entity.metadata.name} entity={entity} />
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
          count={entities.length ?? 0}
          page={page - 1}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
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
      {!loading && !error && <EntitiesList />}

      {rowsPerPage > 10 && (
        <Box marginTop={1}>
          <Pagination />
        </Box>
      )}
    </>
  );
};
