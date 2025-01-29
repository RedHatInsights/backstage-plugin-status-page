import React, { useState } from 'react';
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TablePagination,
  Box,
} from '@material-ui/core';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'resolved':
      return 'primary';
    case 'investigating':
      return 'default';
    default:
      return 'secondary';
  }
};

const IncidentsTable = ({
  incidents,
  onViewUpdates,
  onUpdate,
  onDelete,
}: IncidentsTableProps) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const handleChangePage = (
    _event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number,
  ) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset to first page
  };

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Incident Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Impact</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Updated At</TableCell>
              <TableCell>Incident Updates</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {incidents
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map(incident => (
                <TableRow key={incident.id}>
                  <TableCell>{incident.name}</TableCell>
                  <TableCell>
                    <Chip
                      label={incident.status}
                      color={getStatusColor(incident.status)}
                      style={{ margin: '4px' }}
                    />
                  </TableCell>
                  <TableCell>{incident.impactOverride}</TableCell>
                  <TableCell>
                    {new Date(incident.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {new Date(incident.updatedAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() =>
                        onViewUpdates({
                          updates: incident.incidentUpdates,
                          component: incident.components,
                        })
                      }
                      style={{ marginTop: '10px' }}
                    >
                      View Updates
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Box display="flex">
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => onUpdate(incident.id)}
                        style={{ margin: '5px' }}
                        disabled={incident.status === 'resolved'}
                      >
                        Update
                      </Button>
                      <Button
                        variant="outlined"
                        color="secondary"
                        onClick={() => onDelete(incident.id)}
                        style={{ margin: '5px' }}
                      >
                        Delete
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={incidents.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </>
  );
};

export default IncidentsTable;
