import { useState } from 'react';
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
  makeStyles,
} from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import AssignmentIcon from '@material-ui/icons/Assignment';
import TemplatesTable from './TemplatesTable';
import { getBackstageChipStyle } from '../utils';

const useStyles = makeStyles((theme) => ({
  updateButton: {
    color: '#1976d2',
    borderColor: '#1976d2',
    '&:hover': {
      backgroundColor: 'rgba(25, 118, 210, 0.04)',
      borderColor: '#1976d2',
    },
  },
  postmortemButton: {
    color: '#757575',
    borderColor: '#757575',
    '&:hover': {
      backgroundColor: 'rgba(117, 117, 117, 0.04)',
      borderColor: '#757575',
    },
  },
  deleteButton: {
    color: '#d32f2f',
    borderColor: '#d32f2f',
    '&:hover': {
      backgroundColor: 'rgba(211, 47, 47, 0.04)',
      borderColor: '#d32f2f',
    },
  },
  buttonIcon: {
    marginRight: theme.spacing(0.5),
    fontSize: '1rem',
  },
}));

const IncidentsTable = ({
  incidents,
  onViewUpdates,
  onUpdate,
  onDelete,
  refreshTemplates,
  onEditTemplate,
  onSetTabIndex,
  searchTermForTemplates,
}: IncidentsTableProps) => {
  const classes = useStyles();
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
    setPage(0);
  };

  const filteredIncidents = incidents.filter(incident =>
    tabIndex === 0 ? !incident.scheduledFor : incident.scheduledFor,
  );

  return (
    <>
      <Tabs
        value={tabIndex}
        onChange={(_, newValue) => {
          setTabIndex(newValue);
          onSetTabIndex(newValue);
        }}
      >
        <Tab label="Incidents" />
        <Tab label="Maintenance" />
        <Tab label="Templates" />
      </Tabs>

      {tabIndex === 2 ? (
        <TemplatesTable
          refreshTemplates={refreshTemplates}
          onEditTemplate={template => onEditTemplate(template)}
          searchTermForTemplates={searchTermForTemplates}
        />
      ) : (
        <>
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
                          variant="outlined"
                          label={incident.status.toLocaleUpperCase()}
                          style={{
                            margin: '4px',
                            ...getBackstageChipStyle(incident.status, 'outlined'),
                          }}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={incident.impactOverride.toLocaleUpperCase()}
                          style={{
                            margin: '4px',
                            ...getBackstageChipStyle(incident.impactOverride, 'default'),
                          }}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(incident.createdAt).toISOString()}
                      </TableCell>
                      {tabIndex === 1 && (
                        <>
                          <TableCell>
                            {incident.scheduledFor &&
                            !isNaN(new Date(incident.scheduledFor).getTime())
                              ? new Date(incident.scheduledFor).toISOString()
                              : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {incident.scheduledUntil &&
                            !isNaN(new Date(incident.scheduledUntil).getTime())
                              ? new Date(incident.scheduledUntil).toISOString()
                              : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {incident.resolvedAt &&
                            !isNaN(new Date(incident.resolvedAt).getTime())
                              ? new Date(incident.resolvedAt).toISOString()
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
                          style={{ marginTop: '10px', width: '8rem' }}
                        >
                          View Updates
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" style={{ gap: '16px' }}>
                          {['resolved', 'completed', 'postmortem'].includes(incident.status) ? (
                            <Button
                              variant="outlined"
                              className={classes.postmortemButton}
                              onClick={() => onUpdate(incident.id)}
                              disabled={false}
                              size="small"
                              style={{ width: '8rem' }}
                              startIcon={<AssignmentIcon className={classes.buttonIcon} />}
                            >
                              Postmortem
                            </Button>
                          ) : (
                            <Button
                              variant="outlined"
                              className={classes.updateButton}
                              onClick={() => onUpdate(incident.id)}
                              disabled={false}
                              size="small"
                              style={{ width: '8rem' }}
                              startIcon={<EditIcon className={classes.buttonIcon} />}
                            >
                              Update
                            </Button>
                          )}
                          <Button
                            variant="outlined"
                            className={classes.deleteButton}
                            onClick={() => onDelete(incident.id)}
                            size="small"
                            startIcon={<DeleteIcon className={classes.buttonIcon} />}
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
      )}
    </>
  );
};

export default IncidentsTable;
