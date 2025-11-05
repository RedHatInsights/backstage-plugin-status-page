import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Grid,
  IconButton,
  Box,
} from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import Autocomplete from '@material-ui/lab/Autocomplete';
import {
  useApi,
  fetchApiRef,
  discoveryApiRef,
  alertApiRef,
} from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import {
  UserEntity,
  stringifyEntityRef,
  parseEntityRef,
} from '@backstage/catalog-model';
import Typography from '@material-ui/core/Typography';

export interface AuditEntry {
  id: string;
  cmdbAppId: string;
  ldapCommonName: string;
  roverLink: string;
  responsibleParty: string;
  directlyUsedBy: string[];
  stillRequired: boolean;
  auditCompleted: boolean;
  usageNotes: string;
  reviewDate?: string;
}

interface SystemAuditFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (entry: Omit<AuditEntry, 'id'>) => void;
  cmdbAppId?: string;
  existingEntry?: AuditEntry;
}

const ROVER_BASE_URL = 'https://rover.redhat.com/groups/group';

interface EntryForm {
  ldapCommonName: string;
  roverLink: string;
  responsibleParty: string;
  directlyUsedBy: string;
  stillRequired: boolean;
  auditCompleted: boolean;
  usageNotes: string;
  reviewDate: string;
}

export const SystemAuditFormDialog = ({
  open,
  onClose,
  onSave,
  cmdbAppId: initialCmdbAppId = '',
  existingEntry,
}: SystemAuditFormDialogProps) => {
  const catalogApi = useApi(catalogApiRef);
  const fetchApi = useApi(fetchApiRef);
  const discoveryApi = useApi(discoveryApiRef);
  const alertApi = useApi(alertApiRef);
  const [cmdbAppId, setCmdbAppId] = useState(initialCmdbAppId);

  const [entries, setEntries] = useState<EntryForm[]>([
    {
      ldapCommonName: existingEntry?.ldapCommonName || '',
      roverLink: existingEntry?.roverLink || '',
      responsibleParty: existingEntry?.responsibleParty || '',
      directlyUsedBy: existingEntry?.directlyUsedBy?.join(', ') || '',
      stillRequired: existingEntry?.stillRequired ?? true,
      auditCompleted: existingEntry?.auditCompleted ?? false,
      usageNotes: existingEntry?.usageNotes || '',
      reviewDate: existingEntry?.reviewDate || '',
    },
  ]);

  const [userOptions, setUserOptions] = useState<UserEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [ldapGroupOptions, setLdapGroupOptions] = useState<string[][]>([]);
  const [ldapGroupLoading, setLdapGroupLoading] = useState<boolean[]>([]);
  const debounceTimers = useRef<(NodeJS.Timeout | null)[]>([]);

  // Helper function to format date for HTML date input (YYYY-MM-DD)
  const formatDateForInput = (date: string | Date | undefined): string => {
    if (!date) return '';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        // If invalid, try to parse as YYYY-MM-DD string
        if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
          return date;
        }
        return '';
      }
      // Format as YYYY-MM-DD
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      // If it's already in YYYY-MM-DD format, return as-is
      if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
      }
      return '';
    }
  };

  // Reset cmdbAppId when dialog opens/closes
  useEffect(() => {
    if (open) {
      setCmdbAppId(initialCmdbAppId);
      // Reset entries when dialog opens with existing entry
      if (existingEntry) {
        setEntries([
          {
            ldapCommonName: existingEntry.ldapCommonName || '',
            roverLink: existingEntry.roverLink || '',
            responsibleParty: existingEntry.responsibleParty || '',
            directlyUsedBy: existingEntry.directlyUsedBy?.join(', ') || '',
            stillRequired: existingEntry.stillRequired ?? true,
            auditCompleted: existingEntry.auditCompleted ?? false,
            usageNotes: existingEntry.usageNotes || '',
            reviewDate: formatDateForInput(existingEntry.reviewDate),
          },
        ]);
      } else {
        // Reset to empty form when creating new entry
        setEntries([
          {
            ldapCommonName: '',
            roverLink: '',
            responsibleParty: '',
            directlyUsedBy: '',
            stillRequired: true,
            auditCompleted: false,
            usageNotes: '',
            reviewDate: '',
          },
        ]);
      }
    }
  }, [open, initialCmdbAppId, existingEntry]);

  // Load users from catalog
  useEffect(() => {
    if (open) {
      setLoading(true);
      catalogApi
        .getEntities({
          filter: { kind: 'User' },
        })
        .then(result => {
          setUserOptions(result.items as UserEntity[]);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [open, catalogApi]);

  // Load LDAP group options for existing entries when dialog opens
  useEffect(() => {
    if (open && existingEntry && existingEntry.ldapCommonName) {
      const loadLdapOptions = async () => {
        try {
          const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
          const resp = await fetchApi.fetch(
            `${baseUrl}/search/groups?q=${encodeURIComponent(
              existingEntry.ldapCommonName,
            )}`,
          );
          if (resp.ok) {
            const groups = await resp.json();
            setLdapGroupOptions(prev => {
              const arr = [...prev];
              if (arr.length > 0) {
                arr[0] = groups;
              } else {
                arr.push(groups);
              }
              return arr;
            });
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Failed to load LDAP groups:', error);
        }
      };
      loadLdapOptions();
    }
  }, [open, existingEntry, discoveryApi, fetchApi]);

  // Initialize LDAP group options arrays when entries change
  useEffect(() => {
    setLdapGroupOptions(prev => {
      if (prev.length !== entries.length) {
        return entries.map(() => []);
      }
      return prev;
    });
    setLdapGroupLoading(prev => {
      if (prev.length !== entries.length) {
        return entries.map(() => false);
      }
      return prev;
    });
    debounceTimers.current = debounceTimers.current.slice(0, entries.length);
  }, [entries]);

  const updateEntry = (index: number, field: keyof EntryForm, value: any) => {
    const newEntries = [...entries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    setEntries(newEntries);
  };

  // Helper function to find user entity from responsibleParty value
  const findUserEntity = (responsibleParty: string): UserEntity | null => {
    if (!responsibleParty || userOptions.length === 0) {
      return null;
    }

    // If responsibleParty is an entity ref, parse and compare
    if (responsibleParty.includes(':')) {
      try {
        const ref = parseEntityRef(responsibleParty);
        return (
          userOptions.find(
            u =>
              ref.kind.toLowerCase() === u.kind.toLowerCase() &&
              ref.namespace === u.metadata.namespace &&
              ref.name === u.metadata.name,
          ) || null
        );
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error parsing entity ref:', error);
        // Fallback to name comparison if parsing fails
        // Extract name from entity ref (e.g., "user:redhat/nmore" -> "nmore")
        const nameMatch = responsibleParty.match(/\/([^/]+)$/);
        const nameToMatch = nameMatch ? nameMatch[1] : responsibleParty;
        return userOptions.find(u => u.metadata.name === nameToMatch) || null;
      }
    }
    // Otherwise compare by name (backward compatibility)
    return userOptions.find(u => u.metadata.name === responsibleParty) || null;
  };

  // Search for Rover groups when LDAP common name changes
  const handleLdapNameChange = async (index: number, value: string) => {
    updateEntry(index, 'ldapCommonName', value);

    if (value.length >= 3) {
      setLdapGroupLoading(prev => {
        const arr = [...prev];
        arr[index] = true;
        return arr;
      });

      if (debounceTimers.current[index]) {
        clearTimeout(debounceTimers.current[index]!);
      }

      debounceTimers.current[index] = setTimeout(async () => {
        try {
          const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
          const resp = await fetchApi.fetch(
            `${baseUrl}/search/groups?q=${encodeURIComponent(value)}`,
          );
          if (resp.ok) {
            const groups = await resp.json();
            setLdapGroupOptions(opts => {
              const arr = [...opts];
              arr[index] = groups;
              return arr;
            });
          } else {
            // eslint-disable-next-line no-console
            console.error(
              'Failed to fetch LDAP groups:',
              resp.status,
              resp.statusText,
            );
            setLdapGroupOptions(opts => {
              const arr = [...opts];
              arr[index] = [];
              return arr;
            });
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error searching LDAP groups:', error);
          setLdapGroupOptions(opts => {
            const arr = [...opts];
            arr[index] = [];
            return arr;
          });
        } finally {
          setLdapGroupLoading(prev => {
            const arr = [...prev];
            arr[index] = false;
            return arr;
          });
        }
      }, 400);
    } else if (value.length === 0) {
      setLdapGroupOptions(opts => {
        const arr = [...opts];
        arr[index] = [];
        return arr;
      });
    }
  };

  const addEntry = () => {
    setEntries([
      ...entries,
      {
        ldapCommonName: '',
        roverLink: '',
        responsibleParty: '',
        directlyUsedBy: '',
        stillRequired: true,
        auditCompleted: false,
        usageNotes: '',
        reviewDate: '',
      },
    ]);
  };

  const removeEntry = (index: number) => {
    if (entries.length > 1) {
      setEntries(entries.filter((_, i) => i !== index));
    }
  };

  const handleSave = () => {
    // Validate required fields
    const errors: string[] = [];

    if (!cmdbAppId || cmdbAppId.trim() === '') {
      errors.push('CMDB App ID is required');
    }

    entries.forEach((entry, index) => {
      if (!entry.ldapCommonName || entry.ldapCommonName.trim() === '') {
        errors.push(`Entry ${index + 1}: LDAP Common Name is required`);
      }
    });

    if (errors.length > 0) {
      alertApi.post({
        message: errors.join('\n'),
        severity: 'error',
        display: 'transient',
      });
      return;
    }

    entries.forEach(entry => {
      const auditEntry = {
        cmdbAppId: cmdbAppId.trim(),
        ldapCommonName: entry.ldapCommonName.trim(),
        roverLink: entry.ldapCommonName.trim()
          ? `${ROVER_BASE_URL}/${entry.ldapCommonName.trim()}`
          : '',
        responsibleParty: entry.responsibleParty,
        directlyUsedBy: entry.directlyUsedBy
          .split(',')
          .map((item: string) => item.trim())
          .filter(Boolean),
        stillRequired: entry.stillRequired,
        auditCompleted: entry.auditCompleted,
        usageNotes: entry.usageNotes,
        reviewDate: entry.reviewDate,
      };
      onSave(auditEntry);
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>System Audit Entry</DialogTitle>
      <DialogContent>
        {!cmdbAppId && (
          <Box mb={2}>
            <TextField
              label="CMDB App ID"
              value={cmdbAppId}
              onChange={e => setCmdbAppId(e.target.value)}
              fullWidth
              variant="outlined"
              required
              helperText="Enter the CMDB Application ID"
            />
          </Box>
        )}
        {cmdbAppId && (
          <Box mb={2}>
            <Typography variant="body2" color="textSecondary">
              CMDB App ID: <strong>{cmdbAppId}</strong>
            </Typography>
          </Box>
        )}

        {entries.map((entry, index) => (
          <Box
            key={index}
            mb={3}
            p={2}
            border="1px solid #e0e0e0"
            borderRadius={1}
          >
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="h6">Entry {index + 1}</Typography>
              <IconButton
                size="small"
                onClick={() => removeEntry(index)}
                disabled={entries.length === 1}
              >
                <DeleteIcon />
              </IconButton>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Autocomplete
                  options={ldapGroupOptions[index] || []}
                  getOptionLabel={(option: string) => option}
                  freeSolo
                  value={entry.ldapCommonName}
                  inputValue={entry.ldapCommonName}
                  onInputChange={(_event: any, newValue: string) => {
                    handleLdapNameChange(index, newValue);
                  }}
                  onChange={(_event: any, newValue: string | null) => {
                    if (newValue) {
                      updateEntry(index, 'ldapCommonName', newValue);
                    }
                  }}
                  loading={ldapGroupLoading[index] || false}
                  renderInput={(params: any) => (
                    <TextField
                      {...params}
                      label="LDAP Common Name"
                      variant="outlined"
                      placeholder="Search for group..."
                      required
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Autocomplete
                  options={userOptions}
                  getOptionLabel={(option: UserEntity) =>
                    option.spec?.profile?.displayName ||
                    option.metadata.title ||
                    option.metadata.name ||
                    ''
                  }
                  value={findUserEntity(entry.responsibleParty)}
                  onChange={(_event: any, newValue: UserEntity | null) => {
                    // Save the full entity ref (e.g., "user:redhat/nmore")
                    updateEntry(
                      index,
                      'responsibleParty',
                      newValue ? stringifyEntityRef(newValue) : '',
                    );
                  }}
                  loading={loading}
                  renderInput={(params: any) => (
                    <TextField
                      {...params}
                      label="Responsible Party"
                      variant="outlined"
                      placeholder="Search for user..."
                    />
                  )}
                  renderOption={(option: UserEntity) => (
                    <Box>
                      <Typography variant="body2">
                        {option.spec?.profile?.displayName ||
                          option.metadata.title ||
                          option.metadata.name ||
                          ''}
                      </Typography>
                    </Box>
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Directly Used by System(s)"
                  value={entry.directlyUsedBy}
                  onChange={e =>
                    updateEntry(index, 'directlyUsedBy', e.target.value)
                  }
                  fullWidth
                  variant="outlined"
                  helperText="Comma-separated list"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={entry.stillRequired}
                      onChange={e =>
                        updateEntry(index, 'stillRequired', e.target.checked)
                      }
                      color="primary"
                    />
                  }
                  label="Still Required?"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={entry.auditCompleted}
                      onChange={e =>
                        updateEntry(index, 'auditCompleted', e.target.checked)
                      }
                      color="primary"
                    />
                  }
                  label="Audit/Cleanup Completed"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Review Date"
                  type="date"
                  value={entry.reviewDate}
                  onChange={e =>
                    updateEntry(index, 'reviewDate', e.target.value)
                  }
                  fullWidth
                  variant="outlined"
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="What is it used for? (Notes)"
                  value={entry.usageNotes}
                  onChange={e =>
                    updateEntry(index, 'usageNotes', e.target.value)
                  }
                  fullWidth
                  multiline
                  rows={3}
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Box>
        ))}

        <Button
          startIcon={<AddIcon />}
          onClick={addEntry}
          variant="outlined"
          fullWidth
        >
          Add Another Entry
        </Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} color="primary" variant="contained">
          {existingEntry ? 'Update' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
