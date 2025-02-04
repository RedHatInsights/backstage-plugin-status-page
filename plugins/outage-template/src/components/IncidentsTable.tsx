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
  Tabs,
  Tab,
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
  const [tabIndex, setTabIndex] = useState(0);

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

  const filteredIncidents = incidents.filter(incident =>
    tabIndex === 0 ? !incident.scheduledFor : incident.scheduledFor,
  );

  return (
    <>
      <Tabs value={tabIndex} onChange={(_, newValue) => setTabIndex(newValue)}>
        <Tab label="Incidents" />
        <Tab label="Scheduled Maintenance" />
      </Tabs>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Incident Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Impact</TableCell>
              <TableCell>Created At</TableCell>
              {tabIndex === 1 && (
                <>
                  <TableCell>Scheduled For</TableCell>
                  <TableCell>Scheduled Until</TableCell>
                  <TableCell>Started At</TableCell>
                  <TableCell>Resolved At</TableCell>
                </>
              )}
              <TableCell>Incident Updates</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredIncidents
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
                  {tabIndex === 1 && (
                    <>
                      <TableCell>
                        {new Date(incident.scheduledFor).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {new Date(incident.scheduledUntil).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {incident.startedAt
                          ? new Date(incident.startedAt).toLocaleString()
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {incident.resolvedAt
                          ? new Date(incident.resolvedAt).toLocaleString()
                          : 'N/A'}
                      </TableCell>
                    </>
                  )}
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
                        disabled={
                          incident.status === 'resolved' ||
                          incident.status === 'completed'
                        }
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
        count={filteredIncidents.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </>
  );
};

export default IncidentsTable;
