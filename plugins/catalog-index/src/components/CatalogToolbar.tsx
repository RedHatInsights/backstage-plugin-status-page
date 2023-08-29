import React, { useState } from 'react';
import {
  EntityKindPicker,
  EntitySearchBar,
  EntityTypePicker,
  useEntityList,
} from '@backstage/plugin-catalog-react';
import {
  Box,
  TablePagination,
  Typography,
  makeStyles,
} from '@material-ui/core';
import { alertApiRef, useApi } from '@backstage/core-plugin-api';

const useStyles = makeStyles(theme => ({
  container: {
    gap: theme.spacing(1),
  },
  textLabel: {
    fontWeight: 'bold',
  },
}));

export const CatalogToolbar = () => {
  const [page, setPage] = useState(0);
  const [rowsPerpage, setRowsPerPage] = useState(10);
  const { container, textLabel } = useStyles();
  const alertApi = useApi(alertApiRef);

  const { error, entities } = useEntityList();

  const handleChangePage = (
    _: React.MouseEvent<HTMLButtonElement, MouseEvent> | null,
    newPage: number,
  ) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (error) {
    alertApi.post({
      message: error.message,
      display: 'transient',
      severity: 'error',
    });
  }

  return (
    <Box
      display="flex"
      flexDirection="row"
      flexWrap="wrap"
      className={container}
    >
      <Box
        alignSelf="flex-end"
        display="flex"
        marginBottom="0.75rem"
        flexDirection="column"
      >
        <Typography variant="body2" component="label" className={textLabel}>
          Search
        </Typography>
        <EntitySearchBar />
      </Box>
      <EntityKindPicker />
      <Box alignSelf="flex-end" marginBottom={1}>
        <EntityTypePicker />
      </Box>

      {entities.length > rowsPerpage && (
        <Box alignSelf="flex-end" flexGrow={1} marginBottom={2}>
          <TablePagination
            component="div"
            count={entities.length ?? 0}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerpage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Rows:"
          />
        </Box>
      )}
    </Box>
  );
};
