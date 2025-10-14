import {
  alertApiRef,
  discoveryApiRef,
  fetchApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Typography,
} from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
import Tooltip from '@material-ui/core/Tooltip';
import InfoIcon from '@material-ui/icons/Info';
import AddIcon from '@material-ui/icons/Add';
import CloseIcon from '@material-ui/icons/Close';
import { Fragment, useEffect, useRef, useState } from 'react';
import { UserEntity } from '@backstage/catalog-model';
import { AccountEntry } from './types';
import { ManualDataUpload } from './ManualDataUpload';

const RequiredAsterisk = () => (
  <span style={{ color: 'red', marginLeft: 2 }}>*</span>
);

interface AccountEntriesSectionProps {
  accounts: AccountEntry[];
  onAccountsChange: (accounts: AccountEntry[]) => void;
  appName?: string;
  frequency?: string;
  period?: string;
}

export const AccountEntriesSection = ({
  accounts,
  onAccountsChange,
}: AccountEntriesSectionProps) => {
  const fetchApi = useApi(fetchApiRef);
  const discoveryApi = useApi(discoveryApiRef);
  const alertApi = useApi(alertApiRef);
  const catalogApi = useApi(catalogApiRef);

  // Change groupOptions type to array of arrays of group objects
  const [groupOptions, setGroupOptions] = useState<string[][]>([]);
  const [loadingGroups, setLoadingGroups] = useState<boolean[]>([]);
  const [menuAnchors, setMenuAnchors] = useState<(null | HTMLElement)[]>([]);
  const debounceTimers = useRef<(NodeJS.Timeout | null)[]>([]);

  // Custom reviewer search state for each account entry
  const [customReviewerSearchValues, setCustomReviewerSearchValues] = useState<
    string[]
  >([]);
  const [customReviewerOptions, setCustomReviewerOptions] = useState<
    UserEntity[][]
  >([]);
  const [customReviewerLoading, setCustomReviewerLoading] = useState<boolean[]>(
    [],
  );
  const [selectedCustomReviewers, setSelectedCustomReviewers] = useState<
    (UserEntity | null)[]
  >([]);
  const [showManualUpload, setShowManualUpload] = useState(false);

  // Ensure groupOptions and loadingGroups arrays are always in sync with accounts
  useEffect(() => {
    setGroupOptions(prev => {
      if (prev.length !== accounts.length) {
        return accounts.map(() => []);
      }
      return prev;
    });
    setLoadingGroups(prev => {
      if (prev.length !== accounts.length) {
        return accounts.map(() => false);
      }
      return prev;
    });
    setMenuAnchors(prev => {
      if (prev.length !== accounts.length) {
        return accounts.map(() => null);
      }
      return prev;
    });
    debounceTimers.current = debounceTimers.current.slice(0, accounts.length);
  }, [accounts]);

  // Initialize custom reviewer arrays when accounts change
  useEffect(() => {
    setCustomReviewerSearchValues(prev => {
      if (prev.length !== accounts.length) {
        return accounts.map(() => '');
      }
      return prev;
    });
    setCustomReviewerOptions(prev => {
      if (prev.length !== accounts.length) {
        return accounts.map(() => []);
      }
      return prev;
    });
    setCustomReviewerLoading(prev => {
      if (prev.length !== accounts.length) {
        return accounts.map(() => false);
      }
      return prev;
    });
    setSelectedCustomReviewers(prev => {
      if (prev.length !== accounts.length) {
        return accounts.map(() => null);
      }
      return prev;
    });
  }, [accounts]);

  // Initialize custom reviewers from initial data
  useEffect(() => {
    const initializeCustomReviewers = async () => {
      if (accounts) {
        const customReviewerPromises = accounts.map(async (account, index) => {
          if (account.custom_reviewer) {
            try {
              const ref = `user:redhat/${account.custom_reviewer}`;
              const entity = await catalogApi.getEntityByRef(ref);
              const reviewer =
                entity && entity.kind === 'User'
                  ? (entity as UserEntity)
                  : null;

              if (reviewer) {
                setSelectedCustomReviewers(prev => {
                  const newSelected = [...prev];
                  newSelected[index] = reviewer;
                  return newSelected;
                });

                setCustomReviewerSearchValues(prev => {
                  const newSearchValues = [...prev];
                  newSearchValues[index] =
                    reviewer.spec.profile?.displayName ||
                    reviewer.metadata.name;
                  return newSearchValues;
                });

                setCustomReviewerOptions(prev => {
                  const newOptions = [...prev];
                  newOptions[index] = [reviewer];
                  return newOptions;
                });
              }
            } catch (err) {
              // Silently handle error - custom reviewer will remain empty
            }
          }
        });

        await Promise.all(customReviewerPromises);
      }
    };

    if (accounts && accounts.length > 0) {
      initializeCustomReviewers();
    }
  }, [accounts, catalogApi]);

  // Search for custom reviewers when search values change
  useEffect(() => {
    const searchCustomReviewers = async () => {
      for (let index = 0; index < customReviewerSearchValues.length; index++) {
        const searchValue = customReviewerSearchValues[index];
        const selectedReviewer = selectedCustomReviewers[index];

        if (
          searchValue &&
          searchValue.length >= 3 &&
          searchValue !== selectedReviewer?.spec.profile?.displayName
        ) {
          setCustomReviewerLoading(prev => {
            const newLoading = [...prev];
            newLoading[index] = true;
            return newLoading;
          });

          try {
            const response = await catalogApi.queryEntities({
              filter: [{ kind: 'User' }],
              fullTextFilter: {
                term: searchValue,
                fields: ['metadata.name', 'spec.profile.displayName'],
              },
            });

            const searchResults = response.items as UserEntity[];
            const allOptions =
              selectedReviewer &&
              !searchResults.find(
                u => u.metadata.name === selectedReviewer.metadata.name,
              )
                ? [selectedReviewer, ...searchResults]
                : searchResults;

            setCustomReviewerOptions(prev => {
              const newOptions = [...prev];
              newOptions[index] = allOptions;
              return newOptions;
            });
          } catch (error) {
            alertApi.post({
              message: `Failed to search users: ${error}`,
              severity: 'error',
            });
          } finally {
            setCustomReviewerLoading(prev => {
              const newLoading = [...prev];
              newLoading[index] = false;
              return newLoading;
            });
          }
        } else if (searchValue && searchValue.length === 0) {
          if (selectedReviewer) {
            setCustomReviewerOptions(prev => {
              const newOptions = [...prev];
              newOptions[index] = [selectedReviewer];
              return newOptions;
            });
          } else {
            setCustomReviewerOptions(prev => {
              const newOptions = [...prev];
              newOptions[index] = [];
              return newOptions;
            });
          }
        }
      }
    };

    searchCustomReviewers();
  }, [
    customReviewerSearchValues,
    catalogApi,
    alertApi,
    selectedCustomReviewers,
  ]);

  // Get display name for user options
  const getUserDisplayName = (user: UserEntity) => {
    return user.spec.profile?.displayName || user.metadata.name;
  };

  // Get user option label with email
  const getUserOptionLabel = (user: UserEntity) => {
    const displayName = getUserDisplayName(user);
    const email = user.spec.profile?.email;
    return email ? `${displayName} (${email})` : displayName;
  };

  // Handle custom reviewer selection for a specific account entry
  const handleCustomReviewerChange = (
    index: number,
    selectedUser: UserEntity | null,
  ) => {
    const newAccounts = [...accounts];
    if (selectedUser) {
      newAccounts[index] = {
        ...newAccounts[index],
        custom_reviewer: selectedUser.metadata.name,
      };
    } else {
      newAccounts[index] = {
        ...newAccounts[index],
        custom_reviewer: '',
      };
    }
    onAccountsChange(newAccounts);

    // Update selected reviewers state
    setSelectedCustomReviewers(prev => {
      const newSelected = [...prev];
      newSelected[index] = selectedUser;
      return newSelected;
    });
  };

  const handleAddAccountEntry = () => {
    const newAccount: AccountEntry = {
      type: 'rover-group-name',
      source: 'rover',
      account_name: '',
      custom_reviewer: '',
    };
    const newAccounts = [...accounts, newAccount];
    onAccountsChange(newAccounts);

    // Initialize custom reviewer arrays for the new entry
    setCustomReviewerSearchValues(prev => [...prev, '']);
    setCustomReviewerOptions(prev => [...prev, []]);
    setCustomReviewerLoading(prev => [...prev, false]);
    setSelectedCustomReviewers(prev => [...prev, null]);
  };

  const handleRemoveAccountEntry = (index: number) => {
    const newAccounts = accounts.filter((_, i) => i !== index);
    onAccountsChange(newAccounts);

    // Remove corresponding custom reviewer state
    setCustomReviewerSearchValues(prev => prev.filter((_, i) => i !== index));
    setCustomReviewerOptions(prev => prev.filter((_, i) => i !== index));
    setCustomReviewerLoading(prev => prev.filter((_, i) => i !== index));
    setSelectedCustomReviewers(prev => prev.filter((_, i) => i !== index));
  };

  const handleAccountChange = (
    index: number,
    field: keyof AccountEntry,
    value: string,
  ) => {
    const newAccounts = [...accounts];
    newAccounts[index] = { ...newAccounts[index], [field]: value };
    onAccountsChange(newAccounts);
  };

  // Handler for account name input with debounce and API call
  const handleAccountNameChange = (
    index: number,
    value: string,
    anchorEl?: HTMLElement,
  ) => {
    handleAccountChange(index, 'account_name', value);
    const entry = accounts[index];
    if (
      entry.type === 'rover-group-name' &&
      entry.source === 'rover' &&
      value.length >= 3
    ) {
      setLoadingGroups(lg => {
        const arr = [...lg];
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
            setGroupOptions(opts => {
              const arr = [...opts];
              arr[index] = groups;
              return arr;
            });
            setMenuAnchors(anchors => {
              const arr = [...anchors];
              arr[index] = anchorEl || arr[index];
              return arr;
            });
            if (Array.isArray(groups) && groups.length === 0) {
              alertApi.post({
                message: 'No matching rover group found',
                severity: 'error',
                display: 'transient',
              });
            }
          } else {
            setGroupOptions(opts => {
              const arr = [...opts];
              arr[index] = [];
              return arr;
            });
            setMenuAnchors(anchors => {
              const arr = [...anchors];
              arr[index] = null;
              return arr;
            });
          }
        } catch {
          setGroupOptions(opts => {
            const arr = [...opts];
            arr[index] = [];
            return arr;
          });
          setMenuAnchors(anchors => {
            const arr = [...anchors];
            arr[index] = null;
            return arr;
          });
        } finally {
          setLoadingGroups(lg => {
            const arr = [...lg];
            arr[index] = false;
            return arr;
          });
        }
      }, 2000);
    } else {
      setGroupOptions(opts => {
        const arr = [...opts];
        arr[index] = [];
        return arr;
      });
      setMenuAnchors(anchors => {
        const arr = [...anchors];
        arr[index] = null;
        return arr;
      });
    }
  };

  const handleMenuClose = (index: number) => {
    setMenuAnchors(anchors => {
      const arr = [...anchors];
      arr[index] = null;
      return arr;
    });
  };

  const handleAccountNameFieldFocus = (
    index: number,
    event: React.FocusEvent<HTMLInputElement>,
  ) => {
    if (groupOptions[index]?.length) {
      setMenuAnchors(anchors => {
        const arr = [...anchors];
        arr[index] = event.currentTarget;
        return arr;
      });
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Account Entries
        </Typography>
        {accounts.map((entry, index) => (
          <Fragment key={index}>
            {index > 0 && <Divider style={{ margin: '16px 0' }} />}
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={3}>
                <Typography variant="subtitle2" style={{ marginBottom: 4 }}>
                  Account Type <RequiredAsterisk />
                  <Tooltip title="Select the type of account: User Accounts (Rover group) or Service Account.">
                    <InfoIcon
                      fontSize="small"
                      style={{ marginLeft: 4, verticalAlign: 'middle' }}
                    />
                  </Tooltip>
                </Typography>
                <TextField
                  select
                  label=""
                  fullWidth
                  value={entry.type}
                  onChange={e =>
                    handleAccountChange(index, 'type', e.target.value)
                  }
                  required
                >
                  <MenuItem value="rover-group-name">User Accounts</MenuItem>
                  <MenuItem value="service-account">Service Account</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={2}>
                <Typography variant="subtitle2" style={{ marginBottom: 4 }}>
                  Source <RequiredAsterisk />
                  <Tooltip title="Select the source system for this account (Rover or GitLab).">
                    <InfoIcon
                      fontSize="small"
                      style={{ marginLeft: 4, verticalAlign: 'middle' }}
                    />
                  </Tooltip>
                </Typography>
                <TextField
                  select
                  label=""
                  fullWidth
                  value={entry.source}
                  onChange={e =>
                    handleAccountChange(index, 'source', e.target.value)
                  }
                  required
                >
                  <MenuItem value="rover">Rover</MenuItem>
                  <MenuItem value="gitlab">GitLab</MenuItem>
                  <MenuItem value="ldap">LDAP</MenuItem>
                  <MenuItem value="manual">Manual</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="subtitle2" style={{ marginBottom: 4 }}>
                  Account Name <RequiredAsterisk />
                  <Tooltip title="Enter the exact account name (group or service account) as it appears in the source system.">
                    <InfoIcon
                      fontSize="small"
                      style={{ marginLeft: 4, verticalAlign: 'middle' }}
                    />
                  </Tooltip>
                </Typography>
                {(() => {
                  if (
                    entry.type === 'rover-group-name' &&
                    entry.source === 'rover'
                  ) {
                    return (
                      <>
                        <TextField
                          label=""
                          fullWidth
                          value={entry.account_name}
                          onChange={e =>
                            handleAccountNameChange(
                              index,
                              e.target.value,
                              e.currentTarget,
                            )
                          }
                          onFocus={e =>
                            handleAccountNameFieldFocus(
                              index,
                              e as React.FocusEvent<HTMLInputElement>,
                            )
                          }
                          required
                          autoComplete="off"
                          placeholder="Enter at least 3 characters to search"
                          InputProps={{
                            endAdornment: loadingGroups[index] ? (
                              <CircularProgress size={18} />
                            ) : null,
                          }}
                        />
                        <Menu
                          anchorEl={menuAnchors[index]}
                          open={
                            !!menuAnchors[index] &&
                            !!groupOptions[index]?.length
                          }
                          onClose={() => handleMenuClose(index)}
                          getContentAnchorEl={null}
                          anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'left',
                          }}
                          transformOrigin={{
                            vertical: 'top',
                            horizontal: 'left',
                          }}
                        >
                          {groupOptions[index]?.map((cn: string) => (
                            <MenuItem
                              key={cn}
                              value={cn}
                              onClick={() => {
                                handleAccountChange(index, 'account_name', cn);
                                handleMenuClose(index);
                              }}
                            >
                              {cn}
                            </MenuItem>
                          ))}
                        </Menu>
                      </>
                    );
                  }

                  if (entry.source === 'manual') {
                    return (
                      <TextField
                        label=""
                        fullWidth
                        value={entry.account_name}
                        onChange={e =>
                          handleAccountChange(
                            index,
                            'account_name',
                            e.target.value,
                          )
                        }
                        required
                        placeholder="Enter account name"
                      />
                    );
                  }

                  return (
                    <TextField
                      label=""
                      fullWidth
                      value={entry.account_name}
                      onChange={e =>
                        handleAccountChange(
                          index,
                          'account_name',
                          e.target.value,
                        )
                      }
                      required
                    />
                  );
                })()}
              </Grid>
              {entry.type === 'service-account' && (
                <Grid item xs={12} sm={3}>
                  <Typography variant="subtitle2" style={{ marginBottom: 4 }}>
                    Custom Reviewer
                    <Tooltip title="Override the application-level custom reviewer for this specific service account. Leave empty to use the application default.">
                      <InfoIcon
                        fontSize="small"
                        style={{ marginLeft: 4, verticalAlign: 'middle' }}
                      />
                    </Tooltip>
                  </Typography>
                  <Autocomplete
                    options={customReviewerOptions[index] || []}
                    getOptionLabel={getUserOptionLabel}
                    value={selectedCustomReviewers[index] || null}
                    onChange={(_event, newValue) =>
                      handleCustomReviewerChange(index, newValue)
                    }
                    onInputChange={(_event, newInputValue) => {
                      setCustomReviewerSearchValues(prev => {
                        const newValues = [...prev];
                        newValues[index] = newInputValue;
                        return newValues;
                      });
                      if (!newInputValue && !selectedCustomReviewers[index]) {
                        setCustomReviewerOptions(prev => {
                          const newOptions = [...prev];
                          newOptions[index] = [];
                          return newOptions;
                        });
                      }
                    }}
                    renderInput={params => (
                      <TextField
                        {...params}
                        label=""
                        placeholder="Leave empty to use application default"
                        size="small"
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {customReviewerLoading[index] ? (
                                <CircularProgress color="inherit" size={20} />
                              ) : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>
              )}
              <Grid item xs={12} sm={1}>
                <IconButton
                  color="secondary"
                  onClick={() => handleRemoveAccountEntry(index)}
                  disabled={accounts.length === 1}
                >
                  <CloseIcon />
                </IconButton>
              </Grid>
            </Grid>
          </Fragment>
        ))}

        <Box style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddAccountEntry}
          >
            Add Account Entry
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => setShowManualUpload(!showManualUpload)}
          >
            {showManualUpload ? 'Hide Manual Upload' : 'Add Manual Entry'}
          </Button>
        </Box>

        {/* Show Manual Data Upload */}
        {showManualUpload && (
          <ManualDataUpload
            appName=""
            frequency=""
            period=""
            onUploadSuccess={async data => {
              // Convert uploaded data to account entries format and lookup users by email
              const manualAccounts: AccountEntry[] = [];
              const newSelectedCustomReviewers: (UserEntity | null)[] = [];

              for (const item of data) {
                let selectedUser: UserEntity | null = null;

                // If custom_reviewer is an email, look up the user
                if (
                  item.custom_reviewer &&
                  item.custom_reviewer.includes('@')
                ) {
                  try {
                    const searchResults = await catalogApi.queryEntities({
                      filter: [{ kind: 'User' }],
                      fullTextFilter: {
                        term: item.custom_reviewer,
                        fields: ['spec.profile.email'],
                      },
                    });

                    const users = searchResults.items as UserEntity[];
                    selectedUser =
                      users.find(
                        user =>
                          user.spec.profile?.email === item.custom_reviewer,
                      ) || null;
                  } catch (error) {
                    // eslint-disable-next-line no-console
                    console.warn(
                      'Failed to lookup user by email:',
                      item.custom_reviewer,
                      error,
                    );
                  }
                }

                manualAccounts.push({
                  type: item.type,
                  source: item.source, // Preserve the original source from Excel
                  account_name: item.account_name,
                  custom_reviewer: selectedUser
                    ? selectedUser.metadata.name
                    : item.custom_reviewer,
                });

                newSelectedCustomReviewers.push(selectedUser);
              }

              // Update selected custom reviewers state
              setSelectedCustomReviewers(newSelectedCustomReviewers);

              // Replace all accounts with uploaded manual accounts
              onAccountsChange(manualAccounts);
              setShowManualUpload(false);
            }}
            onUploadError={error => {
              alertApi.post({
                message: `Manual data upload failed: ${error}`,
                severity: 'error',
              });
            }}
          />
        )}
      </CardContent>
    </Card>
  );
};
