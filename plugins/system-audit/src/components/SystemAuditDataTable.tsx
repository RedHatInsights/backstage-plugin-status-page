import { useState, useEffect } from 'react';
import {
  InfoCard,
  Link,
  Table,
  TableColumn,
  EmptyState,
} from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import {
  fetchApiRef,
  discoveryApiRef,
  alertApiRef,
} from '@backstage/core-plugin-api';
import { catalogApiRef, EntityRefLink } from '@backstage/plugin-catalog-react';
import { AuditEntry, SystemAuditFormDialog } from './SystemAuditFormDialog';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  Chip,
  Grid,
  CircularProgress,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import AddIcon from '@material-ui/icons/Add';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import { SystemAuditApi } from '../services/SystemAuditApi';

interface EnrichedAuditEntry extends AuditEntry {
  applicationName?: string;
  applicationTitle?: string;
  applicationOwner?: string;
  applicationEntityRef?: string;
  updatedAt?: string;
}

export const SystemAuditDataTable = () => {
  const [entries, setEntries] = useState<EnrichedAuditEntry[]>([]);
  const [grouped, setGrouped] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [cmdbAppId, setCmdbAppId] = useState('');
  const [editingEntry, setEditingEntry] = useState<EnrichedAuditEntry | null>(
    null,
  );
  const [entryToDelete, setEntryToDelete] = useState<EnrichedAuditEntry | null>(
    null,
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const catalogApi = useApi(catalogApiRef);
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
  const alertApi = useApi(alertApiRef);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const api = new SystemAuditApi(discoveryApi, fetchApi);
      const allEntries = await api.getAllEntries();

      const enrichedEntries = await Promise.all(
        allEntries.map(async entry => {
          try {
            // Search for entities with matching CMDB appcode annotation
            const searchResult = await catalogApi.getEntities({
              filter: {
                [`metadata.annotations.servicenow.com/appcode`]:
                  entry.cmdbAppId,
                kind: ['component'],
              },
            });

            if (searchResult.items.length > 0) {
              const entity = searchResult.items[0];
              const applicationName = entity.metadata.name;
              const applicationTitle =
                entity.metadata.title || entity.metadata.name;
              const applicationOwner = (entity.spec as any)?.owner as
                | string
                | undefined;
              const applicationEntityRef = `/catalog/${entity.metadata.namespace}/${entity.kind}/${entity.metadata.name}`;

              return {
                ...entry,
                applicationName,
                applicationTitle,
                applicationOwner,
                applicationEntityRef,
              };
            }
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error(
              `Error fetching catalog data for ${entry.cmdbAppId}:`,
              error,
            );
          }
          return entry;
        }),
      );

      setEntries(enrichedEntries);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error loading system audit entries:', error);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogApi, discoveryApi, fetchApi]);

  const handleAdd = () => {
    setCmdbAppId('');
    setEditingEntry(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (entry: EnrichedAuditEntry) => {
    setEditingEntry(entry);
    setCmdbAppId(entry.cmdbAppId);
    setIsDialogOpen(true);
  };

  const handleDelete = (entry: EnrichedAuditEntry) => {
    setEntryToDelete(entry);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!entryToDelete || !entryToDelete.id) {
      return;
    }

    try {
      const api = new SystemAuditApi(discoveryApi, fetchApi);
      await api.deleteEntry(Number(entryToDelete.id));
      setDeleteDialogOpen(false);
      setEntryToDelete(null);
      alertApi.post({
        message: 'Entry deleted successfully',
        severity: 'success',
        display: 'transient',
      });
      // Reload entries after delete
      await loadEntries();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to delete entry:', error);
      alertApi.post({
        message:
          error instanceof Error
            ? error.message
            : 'Failed to delete entry. Please try again.',
        severity: 'error',
        display: 'transient',
      });
    }
  };

  const handleSave = async (entryData: Omit<AuditEntry, 'id'>) => {
    try {
      const api = new SystemAuditApi(discoveryApi, fetchApi);
      if (editingEntry && editingEntry.id) {
        // Update existing entry
        await api.updateEntry(Number(editingEntry.id), entryData);
        alertApi.post({
          message: 'Entry updated successfully',
          severity: 'success',
          display: 'transient',
        });
      } else {
        // Create new entry
        await api.createEntry(entryData);
        alertApi.post({
          message: 'Entry created successfully',
          severity: 'success',
          display: 'transient',
        });
      }
      setIsDialogOpen(false);
      setCmdbAppId('');
      setEditingEntry(null);
      // Reload entries after save
      await loadEntries();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to save entry:', error);
      alertApi.post({
        message:
          error instanceof Error
            ? error.message
            : 'Failed to save entry. Please try again.',
        severity: 'error',
        display: 'transient',
      });
    }
  };

  // Group entries by cmdbAppId
  const groupedEntries = entries.reduce((acc, entry) => {
    const key = entry.cmdbAppId;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(entry);
    return acc;
  }, {} as Record<string, EnrichedAuditEntry[]>);

  // Reusable column definitions for accordion details table
  const accordionDetailColumns: TableColumn<EnrichedAuditEntry>[] = [
    {
      title: 'CMDB App ID',
      field: 'cmdbAppId',
    },
    {
      title: 'LDAP Common Name',
      field: 'ldapCommonName',
      render: (entry: EnrichedAuditEntry) =>
        entry.ldapCommonName ? (
          <EntityRefLink entityRef={`group:redhat/${entry.ldapCommonName}`} />
        ) : (
          'N/A'
        ),
    },
    {
      title: 'Responsible Party',
      field: 'responsibleParty',
      render: (entry: EnrichedAuditEntry) =>
        entry.responsibleParty ? (
          <EntityRefLink
            entityRef={
              entry.responsibleParty.includes(':')
                ? entry.responsibleParty
                : `user:redhat/${entry.responsibleParty}`
            }
          />
        ) : (
          'N/A'
        ),
    },
    {
      title: 'Used By',
      field: 'directlyUsedBy',
      render: (entry: EnrichedAuditEntry) => entry.directlyUsedBy.join(', '),
    },
    {
      title: 'Still Required',
      field: 'stillRequired',
      render: (entry: EnrichedAuditEntry) => (
        <Chip
          label={entry.stillRequired ? 'Yes' : 'No'}
          size="small"
          color={entry.stillRequired ? undefined : 'secondary'}
          style={{
            backgroundColor: entry.stillRequired ? '#e8f5e9' : '#ffebee',
            color: entry.stillRequired ? '#2e7d32' : '#c62828',
          }}
        />
      ),
    },
    {
      title: 'Review Date',
      field: 'reviewDate',
      render: (entry: EnrichedAuditEntry) =>
        entry.reviewDate && entry.reviewDate !== 'NA'
          ? new Date(entry.reviewDate).toLocaleDateString()
          : 'N/A',
    },
    {
      title: 'Audit Completed',
      field: 'auditCompleted',
      render: (entry: EnrichedAuditEntry) => (
        <Chip
          label={entry.auditCompleted ? 'Completed' : 'Not Completed'}
          size="small"
          style={{
            backgroundColor: entry.auditCompleted ? '#e8f5e9' : '#ffebee',
            color: entry.auditCompleted ? '#2e7d32' : '#c62828',
          }}
        />
      ),
    },
    {
      title: 'Notes',
      field: 'usageNotes',
    },
    {
      title: 'Updated At',
      field: 'updatedAt',
      defaultSort: 'desc',
      render: (entry: EnrichedAuditEntry) =>
        entry.updatedAt
          ? `${new Date(entry.updatedAt).toLocaleDateString()} ${new Date(
              entry.updatedAt,
            ).toLocaleTimeString()}`
          : 'N/A',
    },
    {
      title: 'Actions',
      field: 'actions',
      sorting: false,
      render: (entry: EnrichedAuditEntry) => (
        <Box display="flex" style={{ gap: 8 }}>
          <IconButton
            onClick={() => handleEdit(entry)}
            color="primary"
            size="small"
            title="Edit entry"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            onClick={() => handleDelete(entry)}
            color="secondary"
            size="small"
            title="Delete entry"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  // Full table columns for non-grouped view
  const fullTableColumns: TableColumn<EnrichedAuditEntry>[] = [
    {
      title: 'Application Name',
      field: 'applicationName',
      render: (entry: EnrichedAuditEntry) =>
        entry.applicationEntityRef ? (
          <Link to={entry.applicationEntityRef}>
            {entry.applicationTitle || entry.applicationName || 'N/A'}
          </Link>
        ) : (
          entry.applicationTitle || entry.applicationName || 'N/A'
        ),
    },
    {
      title: 'Application Owner',
      field: 'applicationOwner',
      render: (entry: EnrichedAuditEntry) =>
        entry.applicationOwner ? (
          <EntityRefLink
            entityRef={entry.applicationOwner}
            defaultKind="user"
            defaultNamespace="default"
          />
        ) : (
          'N/A'
        ),
    },
    {
      title: 'CMDB App ID',
      field: 'cmdbAppId',
    },
    {
      title: 'LDAP Common Name',
      field: 'ldapCommonName',
      render: (entry: EnrichedAuditEntry) =>
        entry.ldapCommonName ? (
          <EntityRefLink entityRef={`group:redhat/${entry.ldapCommonName}`} />
        ) : (
          'N/A'
        ),
    },
    {
      title: 'Responsible Party',
      field: 'responsibleParty',
      render: (entry: EnrichedAuditEntry) =>
        entry.responsibleParty ? (
          <EntityRefLink
            entityRef={
              entry.responsibleParty.includes(':')
                ? entry.responsibleParty
                : `user:redhat/${entry.responsibleParty}`
            }
          />
        ) : (
          'N/A'
        ),
    },
    {
      title: 'Used By',
      field: 'directlyUsedBy',
      render: (entry: EnrichedAuditEntry) => entry.directlyUsedBy.join(', '),
    },
    {
      title: 'Still Required',
      field: 'stillRequired',
      render: (entry: EnrichedAuditEntry) => (
        <Chip
          label={entry.stillRequired ? 'Yes' : 'No'}
          size="small"
          color={entry.stillRequired ? undefined : 'secondary'}
          style={{
            backgroundColor: entry.stillRequired ? '#e8f5e9' : '#ffebee',
            color: entry.stillRequired ? '#2e7d32' : '#c62828',
          }}
        />
      ),
    },
    {
      title: 'Review Date',
      field: 'reviewDate',
      render: (entry: EnrichedAuditEntry) =>
        entry.reviewDate && entry.reviewDate !== 'NA'
          ? new Date(entry.reviewDate).toLocaleDateString()
          : 'N/A',
    },
    {
      title: 'Audit Completed',
      field: 'auditCompleted',
      render: (entry: EnrichedAuditEntry) => (
        <Chip
          label={entry.auditCompleted ? 'Completed' : 'Not Completed'}
          size="small"
          style={{
            backgroundColor: entry.auditCompleted ? '#e8f5e9' : '#ffebee',
            color: entry.auditCompleted ? '#2e7d32' : '#c62828',
          }}
        />
      ),
    },
    {
      title: 'Notes',
      field: 'usageNotes',
    },
    {
      title: 'Updated At',
      field: 'updatedAt',
      defaultSort: 'desc',
      render: (entry: EnrichedAuditEntry) =>
        entry.updatedAt
          ? `${new Date(entry.updatedAt).toLocaleDateString()} ${new Date(
              entry.updatedAt,
            ).toLocaleTimeString()}`
          : 'N/A',
    },
    {
      title: 'Actions',
      field: 'actions',
      sorting: false,
      render: (entry: EnrichedAuditEntry) => (
        <Box display="flex" style={{ gap: 8 }}>
          <IconButton
            onClick={() => handleEdit(entry)}
            color="primary"
            size="small"
            title="Edit entry"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            onClick={() => handleDelete(entry)}
            color="secondary"
            size="small"
            title="Delete entry"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  const renderContent = () => {
    // Empty state
    if (entries.length === 0) {
      return (
        <EmptyState
          title="No audit entries found"
          missing="content"
          description="Get started by adding your first audit entry"
          action={
            <Button
              startIcon={<AddIcon />}
              onClick={handleAdd}
              variant="contained"
              color="primary"
            >
              Add Entry
            </Button>
          }
        />
      );
    }

    // Non-grouped view - shows all columns
    if (!grouped) {
      return (
        <Table
          title="System Audit Data"
          options={{
            search: true,
            paging: true,
            pageSize: 10,
            sorting: true,
          }}
          columns={fullTableColumns}
          data={entries}
        />
      );
    }

    // Grouped view - shows accordions with detail tables

    return Object.entries(groupedEntries).map(([appCode, groupEntries]) => {
      const firstEntry = groupEntries[0];
      return (
        <Accordion key={appCode}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Grid
              container
              spacing={2}
              style={{ width: '100%', paddingTop: 8, paddingBottom: 8 }}
            >
              <Grid item xs={2}>
                <Typography
                  variant="caption"
                  color="textSecondary"
                  style={{ display: 'block', marginBottom: 4 }}
                >
                  CMDB Code
                </Typography>
                <Typography variant="body1" style={{ fontWeight: 'bold' }}>
                  {appCode}
                </Typography>
              </Grid>
              <Grid item xs={5}>
                <Typography
                  variant="caption"
                  color="textSecondary"
                  style={{ display: 'block', marginBottom: 4 }}
                >
                  Application
                </Typography>
                {firstEntry.applicationTitle || firstEntry.applicationName ? (
                  <Link to={firstEntry.applicationEntityRef || '#'}>
                    <Typography variant="body1" style={{ fontWeight: 'bold' }}>
                      {firstEntry.applicationTitle ||
                        firstEntry.applicationName}
                    </Typography>
                  </Link>
                ) : (
                  <Typography
                    variant="body2"
                    style={{ fontStyle: 'italic', color: 'textSecondary' }}
                  >
                    Not found
                  </Typography>
                )}
              </Grid>
              <Grid item xs={3}>
                <Typography
                  variant="caption"
                  color="textSecondary"
                  style={{ display: 'block', marginBottom: 4 }}
                >
                  Owner
                </Typography>
                {firstEntry.applicationOwner ? (
                  <EntityRefLink
                    entityRef={firstEntry.applicationOwner}
                    defaultKind="user"
                    defaultNamespace="default"
                  />
                ) : (
                  <Typography
                    variant="body2"
                    style={{ fontStyle: 'italic', color: 'textSecondary' }}
                  >
                    Not assigned
                  </Typography>
                )}
              </Grid>
              <Grid item xs={2} style={{ textAlign: 'right' }}>
                <Chip label={`${groupEntries.length} entries`} size="small" />
              </Grid>
            </Grid>
          </AccordionSummary>
          <AccordionDetails>
            <Box width="100%">
              {/* Using reusable column definitions with CMDB App ID included */}
              <Table
                title={`${appCode} Entries`}
                options={{
                  paging: false,
                  search: false,
                  sorting: true,
                }}
                columns={accordionDetailColumns}
                data={groupEntries}
              />
            </Box>
          </AccordionDetails>
        </Accordion>
      );
    });
  };

  if (loading) {
    return (
      <InfoCard title="Group/Account Entries" variant="fullHeight">
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      </InfoCard>
    );
  }

  return (
    <>
      <InfoCard
        title="Group/Account Entries"
        variant="fullHeight"
        action={
          <Box display="flex" alignItems="center" style={{ gap: 16 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={grouped}
                  onChange={e => setGrouped(e.target.checked)}
                  color="primary"
                />
              }
              label="Group by App Code"
            />
            <Button
              startIcon={<AddIcon />}
              onClick={handleAdd}
              variant="contained"
              color="primary"
            >
              Add Entry
            </Button>
          </Box>
        }
      >
        {renderContent()}
      </InfoCard>

      <SystemAuditFormDialog
        open={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setCmdbAppId('');
          setEditingEntry(null);
        }}
        onSave={handleSave}
        cmdbAppId={cmdbAppId}
        existingEntry={editingEntry || undefined}
        cmdbAppIdEditable
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setEntryToDelete(null);
        }}
      >
        <DialogTitle>Delete Entry</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this entry?</Typography>
          {entryToDelete && (
            <Box mt={2}>
              <Typography variant="body2" color="textSecondary">
                <strong>CMDB App ID:</strong> {entryToDelete.cmdbAppId}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                <strong>LDAP Common Name:</strong>{' '}
                {entryToDelete.ldapCommonName || 'N/A'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false);
              setEntryToDelete(null);
            }}
            color="primary"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="secondary"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
