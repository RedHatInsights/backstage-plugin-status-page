import { useState, useEffect } from 'react';
import {
  Typography,
  Button,
  Box,
  Chip,
  IconButton,
  List,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  withStyles,
  Theme,
  makeStyles,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@material-ui/core';
import { InfoCard } from '@backstage/core-components';
import { useEntity, EntityRefLink } from '@backstage/plugin-catalog-react';
import { parseEntityRef } from '@backstage/catalog-model';
import { useApi } from '@backstage/core-plugin-api';
import {
  fetchApiRef,
  discoveryApiRef,
  alertApiRef,
} from '@backstage/core-plugin-api';
import EditIcon from '@material-ui/icons/Edit';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { SystemAuditFormDialog, AuditEntry } from '../SystemAuditFormDialog';
import { SystemAuditApi } from '../../services/SystemAuditApi';

const StyledGrid = withStyles(theme => ({
  root: {
    paddingBottom: theme.spacing(1),
  },
}))(Grid);

const useStyles = makeStyles((theme: Theme) => ({
  label: {
    color: theme.palette.text.secondary,
    textTransform: 'uppercase',
    fontSize: '10px',
    fontWeight: 'bold',
    letterSpacing: '0.5px',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  },
  value: {
    fontWeight: 'bold',
    overflow: 'hidden',
    lineHeight: '24px',
    wordBreak: 'break-word',
  },
}));

const getCmdbAppId = (entity: any) => {
  return (
    entity?.metadata?.annotations?.['servicenow.com/appcode'] ||
    entity?.metadata?.annotations?.['servicenow.com/app-code'] ||
    ''
  );
};

const getResponsiblePartyEntityRef = (responsibleParty: string): string => {
  // If it's already an entity ref (contains ':'), use it directly
  if (responsibleParty.includes(':')) {
    return responsibleParty;
  }
  // Otherwise construct it from username (backward compatibility)
  return `user:redhat/${responsibleParty}`;
};

export const EntitySystemAuditCard = () => {
  const classes = useStyles();
  const { entity } = useEntity();
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
  const alertApi = useApi(alertApiRef);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<AuditEntry | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);

  const cmdbAppId = getCmdbAppId(entity);
  const filteredEntries = entries.filter(
    entry => entry.cmdbAppId === cmdbAppId,
  );

  // Load data from API
  useEffect(() => {
    const loadEntries = async () => {
      try {
        setLoading(true);
        setError(null);
        const api = new SystemAuditApi(discoveryApi, fetchApi);
        const allEntries = await api.getAllEntries();
        setEntries(allEntries);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error loading entries from API:', err);
        setError(err instanceof Error ? err.message : 'Failed to load entries');
        setEntries([]);
      } finally {
        setLoading(false);
      }
    };

    loadEntries();
  }, [discoveryApi, fetchApi]);

  const handleAdd = () => {
    setEditingEntry(undefined);
    setIsDialogOpen(true);
  };

  const handleEdit = (entry: AuditEntry) => {
    setEditingEntry(entry);
    setIsDialogOpen(true);
  };

  const handleDelete = (entryId: string) => {
    setEntryToDelete(entryId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!entryToDelete) return;

    try {
      setError(null);
      const api = new SystemAuditApi(discoveryApi, fetchApi);
      const id = parseInt(entryToDelete, 10);
      await api.deleteEntry(id);

      // Reload entries after deletion
      const allEntries = await api.getAllEntries();
      setEntries(allEntries);
      setIsDeleteDialogOpen(false);
      setEntryToDelete(null);

      alertApi.post({
        message: 'Entry deleted successfully',
        severity: 'success',
        display: 'transient',
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to delete entry:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete entry');
      alertApi.post({
        message:
          err instanceof Error
            ? err.message
            : 'Failed to delete entry. Please try again.',
        severity: 'error',
        display: 'transient',
      });
    }
  };

  const handleSave = async (entryData: Omit<AuditEntry, 'id'>) => {
    try {
      setError(null);
      const api = new SystemAuditApi(discoveryApi, fetchApi);

      // Ensure cmdbAppId is set and add app_name and application_owner from entity
      const entryWithCmdb = {
        ...entryData,
        cmdbAppId,
        app_name: entity.metadata.name,
        application_owner: (entity.spec as any)?.owner || undefined,
      };

      if (editingEntry && editingEntry.id) {
        // Update existing entry
        const id = parseInt(editingEntry.id, 10);
        await api.updateEntry(id, entryWithCmdb);
      } else {
        // Create new entry
        await api.createEntry(entryWithCmdb);
      }

      // Reload entries after save
      const allEntries = await api.getAllEntries();
      setEntries(allEntries);
      setIsDialogOpen(false);
      setEditingEntry(undefined);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to save entry:', err);
      setError(err instanceof Error ? err.message : 'Failed to save entry');
      alertApi.post({
        message:
          err instanceof Error
            ? err.message
            : 'Failed to save entry. Please try again.',
        severity: 'error',
        display: 'transient',
      });
    }
  };

  return (
    <>
      <InfoCard
        title={
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">
              XE System Audit{' '}
              {filteredEntries.length > 0 && `(${filteredEntries.length})`}
            </Typography>
            <Button
              startIcon={<AddIcon />}
              onClick={handleAdd}
              variant="outlined"
              size="small"
            >
              Add Entry
            </Button>
          </Box>
        }
        variant="gridItem"
      >
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {error && (
              <Typography
                variant="body2"
                color="error"
                style={{ marginBottom: 16 }}
              >
                {error}
              </Typography>
            )}
            {!cmdbAppId && (
              <Typography variant="body2" color="textSecondary">
                CMDB App ID not found. Cannot display audit entries.
              </Typography>
            )}
            {cmdbAppId && filteredEntries.length === 0 && (
              <Typography variant="body2" color="textSecondary">
                No audit entries found for this component. Click "Add Entry" to
                create one.
              </Typography>
            )}
            {cmdbAppId && filteredEntries.length > 0 && (
              <List>
                {filteredEntries.map(entry => (
                  <Accordion key={entry.id}>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      aria-controls="panel-content"
                      id="panel-header"
                    >
                      <Box width="100%" pr={2}>
                        <Box display="flex" alignItems="center" mb={1}>
                          <Box display="flex" alignItems="center">
                            {entry.ldapCommonName ? (
                              <EntityRefLink
                                entityRef={parseEntityRef(
                                  `group:redhat/${entry.ldapCommonName}`,
                                )}
                                defaultKind="Group"
                              />
                            ) : (
                              <Typography variant="body2" color="textSecondary">
                                No LDAP Group
                              </Typography>
                            )}
                            {entry.stillRequired && (
                              <Typography
                                variant="body2"
                                style={{ color: '#d32f2f', marginLeft: 4 }}
                              >
                                *
                              </Typography>
                            )}
                          </Box>
                          <Box flexGrow={1} />
                          {entry.auditCompleted ? (
                            <Tooltip title="Audit Review" placement="top">
                              <Chip
                                label="Completed"
                                size="small"
                                style={{
                                  backgroundColor: '#e8f5e9',
                                  color: '#2e7d32',
                                }}
                              />
                            </Tooltip>
                          ) : (
                            <Tooltip title="Audit Review" placement="top">
                              <Chip
                                label="Not Completed"
                                size="small"
                                style={{
                                  backgroundColor: '#ffebee',
                                  color: '#c62828',
                                }}
                              />
                            </Tooltip>
                          )}
                          <IconButton
                            size="small"
                            onClick={e => {
                              e.stopPropagation();
                              handleEdit(entry);
                            }}
                            style={{ marginLeft: 8 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={e => {
                              e.stopPropagation();
                              handleDelete(entry.id);
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        <Grid container spacing={2}>
                          {entry.responsibleParty && (
                            <Grid item xs={12} sm={4}>
                              <StyledGrid xs={12}>
                                <Typography
                                  variant="h2"
                                  className={classes.label}
                                >
                                  Responsible Party
                                </Typography>
                              </StyledGrid>
                              <StyledGrid xs={12}>
                                <EntityRefLink
                                  entityRef={getResponsiblePartyEntityRef(
                                    entry.responsibleParty,
                                  )}
                                />
                              </StyledGrid>
                            </Grid>
                          )}
                          {entry.directlyUsedBy &&
                            entry.directlyUsedBy.length > 0 && (
                              <Grid item xs={12} sm={4}>
                                <StyledGrid xs={12}>
                                  <Typography
                                    variant="h2"
                                    className={classes.label}
                                  >
                                    Used By
                                  </Typography>
                                </StyledGrid>
                                <StyledGrid xs={12}>
                                  <Typography variant="body2">
                                    {entry.directlyUsedBy.join(', ')}
                                  </Typography>
                                </StyledGrid>
                              </Grid>
                            )}
                          <Grid item xs={12} sm={4}>
                            <StyledGrid xs={12}>
                              <Typography
                                variant="h2"
                                className={classes.label}
                              >
                                Review Date
                              </Typography>
                            </StyledGrid>
                            <StyledGrid xs={12}>
                              <Typography variant="body2">
                                {entry.reviewDate && entry.reviewDate !== 'NA'
                                  ? new Date(
                                      entry.reviewDate,
                                    ).toLocaleDateString()
                                  : 'NA'}
                              </Typography>
                            </StyledGrid>
                          </Grid>
                        </Grid>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <StyledGrid xs={12}>
                            <Typography variant="h2" className={classes.label}>
                              Still Required
                            </Typography>
                          </StyledGrid>
                          <StyledGrid xs={12}>
                            <Typography variant="body2">
                              {entry.stillRequired ? 'Yes' : 'No'}
                            </Typography>
                          </StyledGrid>
                        </Grid>
                        {entry.usageNotes && (
                          <Grid item xs={12} sm={6}>
                            <StyledGrid xs={12}>
                              <Typography
                                variant="h2"
                                className={classes.label}
                              >
                                Notes
                              </Typography>
                            </StyledGrid>
                            <StyledGrid xs={12}>
                              <Typography variant="body2">
                                {entry.usageNotes}
                              </Typography>
                            </StyledGrid>
                          </Grid>
                        )}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </List>
            )}
          </>
        )}
      </InfoCard>

      <SystemAuditFormDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSave}
        cmdbAppId={cmdbAppId}
        existingEntry={editingEntry}
      />

      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setEntryToDelete(null);
        }}
      >
        <DialogTitle>Delete Audit Entry</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this audit entry? This action cannot
            be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setIsDeleteDialogOpen(false);
              setEntryToDelete(null);
            }}
            color="primary"
          >
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="secondary" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
