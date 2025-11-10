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
import { UserEntity, stringifyEntityRef } from '@backstage/catalog-model';
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
  cmdbAppIdEditable?: boolean;
}

const ROVER_BASE_URL = 'https://rover.redhat.com/groups/group';

interface EntryForm {
  cmdbAppId?: string;
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
  cmdbAppIdEditable = false,
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

  const [userOptions, setUserOptions] = useState<UserEntity[][]>([]);
  const [userLoading, setUserLoading] = useState<boolean[]>([]);
  const [userSearchValues, setUserSearchValues] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<(UserEntity | null)[]>([]);
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
      // Reset user-related state
      setUserOptions([]);
      setUserLoading([]);
      setUserSearchValues([]);
      setSelectedUsers([]);
      // Reset LDAP group options
      setLdapGroupOptions([]);
      setLdapGroupLoading([]);

      // Reset entries when dialog opens with existing entry
      if (existingEntry) {
        setEntries([
          {
            cmdbAppId: cmdbAppIdEditable
              ? existingEntry.cmdbAppId || ''
              : undefined,
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
            cmdbAppId: cmdbAppIdEditable ? initialCmdbAppId : undefined,
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
    } else {
      // Reset all state when dialog closes
      setUserOptions([]);
      setUserLoading([]);
      setUserSearchValues([]);
      setSelectedUsers([]);
      setLdapGroupOptions([]);
      setLdapGroupLoading([]);
    }
  }, [open, initialCmdbAppId, existingEntry, cmdbAppIdEditable]);

  // Initialize user options arrays when entries change
  useEffect(() => {
    setUserOptions(prev => {
      if (prev.length !== entries.length) {
        // Preserve existing values or use empty array for new entries
        return entries.map((_, i) => prev[i] ?? []);
      }
      return prev;
    });
    setUserLoading(prev => {
      if (prev.length !== entries.length) {
        // Preserve existing values or use false for new entries
        return entries.map((_, i) => prev[i] ?? false);
      }
      return prev;
    });
    setUserSearchValues(prev => {
      if (prev.length !== entries.length) {
        // Preserve existing values or use empty string for new entries
        return entries.map((_, i) => prev[i] ?? '');
      }
      return prev;
    });
    setSelectedUsers(prev => {
      if (prev.length !== entries.length) {
        // Preserve existing values or use null for new entries
        return entries.map((_, i) => prev[i] ?? null);
      }
      return prev;
    });
  }, [entries]);

  // Initialize selected user from existing entry
  useEffect(() => {
    if (
      open &&
      existingEntry &&
      existingEntry.responsibleParty &&
      entries.length > 0
    ) {
      const initializeUser = async () => {
        try {
          // Try to parse as entity ref first
          let user: UserEntity | null = null;
          if (existingEntry.responsibleParty.includes(':')) {
            try {
              const entity = await catalogApi.getEntityByRef(
                existingEntry.responsibleParty,
              );
              user =
                entity && entity.kind === 'User'
                  ? (entity as UserEntity)
                  : null;
            } catch {
              // If entity ref fails, try search
            }
          }

          if (!user) {
            const userResponse = await catalogApi.queryEntities({
              filter: [{ kind: 'User' }],
              fullTextFilter: {
                term: existingEntry.responsibleParty,
                fields: [
                  'metadata.name',
                  'metadata.title',
                  'spec.profile.displayName',
                  'spec.profile.email',
                ],
              },
            });

            user =
              (userResponse.items.find(
                (item: any) =>
                  item.metadata.name === existingEntry.responsibleParty,
              ) as UserEntity) ||
              (userResponse.items.find(
                (item: any) =>
                  item.spec.profile?.displayName?.toLowerCase() ===
                  existingEntry.responsibleParty.toLowerCase(),
              ) as UserEntity) ||
              (userResponse.items.find(
                (item: any) =>
                  item.spec.profile?.email?.toLowerCase() ===
                  existingEntry.responsibleParty.toLowerCase(),
              ) as UserEntity);
          }

          if (user) {
            setSelectedUsers(prev => {
              const arr = [...prev];
              arr[0] = user;
              return arr;
            });
            setUserOptions(prev => {
              const arr = [...prev];
              arr[0] = [user!];
              return arr;
            });
            setUserSearchValues(prev => {
              const arr = [...prev];
              arr[0] = user!.spec.profile?.displayName || user!.metadata.name;
              return arr;
            });
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('Error fetching user entity:', err);
        }
      };
      initializeUser();
    }
  }, [open, existingEntry, catalogApi, entries.length]);

  // Search for users when search value changes
  useEffect(() => {
    userSearchValues.forEach((searchValue, index) => {
      const selectedUser = selectedUsers[index];
      if (
        searchValue.length >= 3 &&
        searchValue !== selectedUser?.spec.profile?.displayName &&
        searchValue !== selectedUser?.metadata.name
      ) {
        setUserLoading(prev => {
          const arr = [...prev];
          arr[index] = true;
          return arr;
        });
        catalogApi
          .queryEntities({
            filter: [{ kind: 'User' }],
            fullTextFilter: {
              term: searchValue,
              fields: [
                'spec.profile.displayName',
                'metadata.name',
                'spec.profile.email',
              ],
            },
          })
          .then((res: any) => {
            const searchResults = res.items as UserEntity[];
            const allOptions =
              selectedUser &&
              !searchResults.find(
                u => u.metadata.name === selectedUser.metadata.name,
              )
                ? [selectedUser, ...searchResults]
                : searchResults;
            setUserOptions(prev => {
              const arr = [...prev];
              arr[index] = allOptions;
              return arr;
            });
          })
          .catch(() => {
            alertApi.post({
              message: 'Failed to search users',
              severity: 'error',
            });
          })
          .finally(() => {
            setUserLoading(prev => {
              const arr = [...prev];
              arr[index] = false;
              return arr;
            });
          });
      } else if (searchValue.length === 0) {
        if (selectedUser) {
          setUserOptions(prev => {
            const arr = [...prev];
            arr[index] = [selectedUser];
            return arr;
          });
        } else {
          setUserOptions(prev => {
            const arr = [...prev];
            arr[index] = [];
            return arr;
          });
        }
      }
    });
  }, [userSearchValues, catalogApi, alertApi, selectedUsers]);

  // Initialize LDAP group options arrays when entries change
  useEffect(() => {
    setLdapGroupOptions(prev => {
      if (prev.length !== entries.length) {
        // Preserve existing values or use empty array for new entries
        return entries.map((_, i) => prev[i] ?? []);
      }
      return prev;
    });
    setLdapGroupLoading(prev => {
      if (prev.length !== entries.length) {
        // Preserve existing values or use false for new entries
        return entries.map((_, i) => prev[i] ?? false);
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

  // Helper functions for user display
  const getUserDisplayName = (user: UserEntity) => {
    return user.spec.profile?.displayName || user.metadata.name;
  };

  const getUserOptionLabel = (user: UserEntity) => {
    const displayName = getUserDisplayName(user);
    const email = user.spec.profile?.email;
    return email ? `${displayName} (${email})` : displayName;
  };

  // Handle responsible party change
  const handleResponsiblePartyChange = (
    index: number,
    selectedUser: UserEntity | null,
  ) => {
    setSelectedUsers(prev => {
      const arr = [...prev];
      arr[index] = selectedUser;
      return arr;
    });
    if (selectedUser) {
      updateEntry(index, 'responsibleParty', stringifyEntityRef(selectedUser));
    } else {
      updateEntry(index, 'responsibleParty', '');
    }
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
        cmdbAppId: cmdbAppIdEditable ? '' : undefined,
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

    if (!cmdbAppIdEditable && (!cmdbAppId || cmdbAppId.trim() === '')) {
      errors.push('CMDB App ID is required');
    }

    entries.forEach((entry, index) => {
      if (cmdbAppIdEditable) {
        if (!entry.cmdbAppId || entry.cmdbAppId.trim() === '') {
          errors.push(`Entry ${index + 1}: CMDB App ID is required`);
        }
      }
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
        cmdbAppId: cmdbAppIdEditable
          ? (entry.cmdbAppId || '').trim()
          : cmdbAppId.trim(),
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
        {!cmdbAppIdEditable && (
          <>
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
          </>
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
              {cmdbAppIdEditable && (
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="CMDB App ID"
                    value={entry.cmdbAppId || ''}
                    onChange={e =>
                      updateEntry(index, 'cmdbAppId', e.target.value)
                    }
                    fullWidth
                    variant="outlined"
                    required
                    helperText="Enter the CMDB Application ID"
                  />
                </Grid>
              )}
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
                      helperText="Enter at least 3 characters to search"
                      required
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Autocomplete
                  options={userOptions[index] || []}
                  getOptionLabel={getUserOptionLabel}
                  value={selectedUsers[index] || null}
                  onChange={(_event, newValue) =>
                    handleResponsiblePartyChange(index, newValue)
                  }
                  onInputChange={(_event, newInputValue) => {
                    setUserSearchValues(prev => {
                      const arr = [...prev];
                      arr[index] = newInputValue;
                      return arr;
                    });
                    if (!newInputValue && !selectedUsers[index]) {
                      setUserOptions(prev => {
                        const arr = [...prev];
                        arr[index] = [];
                        return arr;
                      });
                    }
                  }}
                  loading={userLoading[index] || false}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label="Responsible Party"
                      variant="outlined"
                      helperText="Enter at least 3 characters to search"
                    />
                  )}
                  renderOption={(option: UserEntity, state) => (
                    <li {...state}>{getUserOptionLabel(option)}</li>
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
              <Grid item xs={12} sm={4}>
                <Box display="flex" flexDirection="row" style={{ gap: 16 }}>
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
                </Box>
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
