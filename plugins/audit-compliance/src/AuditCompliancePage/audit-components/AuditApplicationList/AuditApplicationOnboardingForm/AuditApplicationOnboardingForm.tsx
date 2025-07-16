import { Content } from '@backstage/core-components';
import {
  alertApiRef,
  discoveryApiRef,
  fetchApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import InfoIcon from '@material-ui/icons/Info';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import {
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  TextField,
  CircularProgress,
  Menu,
} from '@material-ui/core';
import { Fragment, useState, useEffect, useRef } from 'react';
import {
  AccountEntry,
  ApplicationFormData,
  AuditApplicationOnboardingFormProps,
} from './types';

const RequiredAsterisk = () => (
  <span style={{ color: 'red', marginLeft: 2 }}>*</span>
);

export const AuditApplicationOnboardingForm = ({
  onSuccess,
  initialData,
  isEditMode = false,
}: AuditApplicationOnboardingFormProps) => {
  const [formData, setFormData] = useState<ApplicationFormData>(() => {
    if (initialData) {
      return initialData;
    }
    return {
      app_name: '',
      cmdb_id: '',
      environment: '',
      app_owner: '',
      app_owner_email: '',
      app_delegate: '',
      jira_project: '',
      accounts: [
        { type: 'rover-group-name', source: 'rover', account_name: '' },
      ],
    };
  });

  const fetchApi = useApi(fetchApiRef);
  const discoveryApi = useApi(discoveryApiRef);
  const alertApi = useApi(alertApiRef);

  // Change groupOptions type to array of arrays of group objects
  const [groupOptions, setGroupOptions] = useState<string[][]>([]); // Array of options for each account entry
  const [loadingGroups, setLoadingGroups] = useState<boolean[]>([]); // Loading state for each entry
  const [menuAnchors, setMenuAnchors] = useState<(null | HTMLElement)[]>([]); // Anchor for each entry
  const debounceTimers = useRef<(NodeJS.Timeout | null)[]>([]);

  // Ensure groupOptions and loadingGroups arrays are always in sync with accounts
  useEffect(() => {
    setGroupOptions(prev => {
      if (prev.length !== formData.accounts.length) {
        return formData.accounts.map(() => []);
      }
      return prev;
    });
    setLoadingGroups(prev => {
      if (prev.length !== formData.accounts.length) {
        return formData.accounts.map(() => false);
      }
      return prev;
    });
    setMenuAnchors(prev => {
      if (prev.length !== formData.accounts.length) {
        return formData.accounts.map(() => null);
      }
      return prev;
    });
    debounceTimers.current = debounceTimers.current.slice(
      0,
      formData.accounts.length,
    );
  }, [formData.accounts]);

  const handleMainFieldChange =
    (field: keyof Omit<ApplicationFormData, 'accounts'>) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData(prev => ({
        ...prev,
        [field]: event.target.value,
      }));
    };

  const handleAddAccountEntry = () => {
    setFormData(prev => ({
      ...prev,
      accounts: [
        ...prev.accounts,
        { type: 'rover-group-name', source: 'rover', account_name: '' },
      ],
    }));
  };

  const handleRemoveAccountEntry = (index: number) => {
    setFormData(prev => ({
      ...prev,
      accounts: prev.accounts.filter((_, i) => i !== index),
    }));
  };

  const handleAccountChange = (
    index: number,
    field: keyof AccountEntry,
    value: string,
  ) => {
    setFormData(prev => {
      const newAccounts = [...prev.accounts];
      newAccounts[index] = { ...newAccounts[index], [field]: value };
      return { ...prev, accounts: newAccounts };
    });
  };

  // Handler for account name input with debounce and API call
  const handleAccountNameChange = (
    index: number,
    value: string,
    anchorEl?: HTMLElement,
  ) => {
    handleAccountChange(index, 'account_name', value);
    const entry = formData.accounts[index];
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
            // Open menu if options available
            setMenuAnchors(anchors => {
              const arr = [...anchors];
              arr[index] = anchorEl || arr[index];
              return arr;
            });
            if (Array.isArray(groups) && groups.length === 0) {
              alertApi.post({
                message: 'No matching rover group found',
                severity: 'error',
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
    // If options are available, open the menu
    if (groupOptions[index]?.length) {
      setMenuAnchors(anchors => {
        const arr = [...anchors];
        arr[index] = event.currentTarget;
        return arr;
      });
    }
  };

  const handleSubmit = async () => {
    try {
      const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
      const endpoint = isEditMode
        ? `/applications/onboarding/${encodeURIComponent(formData.app_name)}`
        : '/applications/onboarding';

      const response = await fetchApi.fetch(`${baseUrl}${endpoint}`, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Check for duplicate key violation
        if (
          errorData.details?.includes(
            'duplicate key value violates unique constraint "applications_pkey"',
          )
        ) {
          throw new Error(
            `Application "${formData.app_name}" already exists. Please use a different application name.`,
          );
        }
        throw new Error(
          errorData.error ||
            `Failed to ${isEditMode ? 'update' : 'create'} application`,
        );
      }

      alertApi.post({
        message: `Application ${
          isEditMode ? 'updated' : 'created'
        } successfully!`,
        severity: 'success',
        display: 'transient',
      });

      // Reset form after successful submission (only for create mode)
      if (!isEditMode) {
        setFormData({
          app_name: '',
          cmdb_id: '',
          environment: '',
          app_owner: '',
          app_owner_email: '',
          app_delegate: '',
          jira_project: '',
          accounts: [
            { type: 'rover-group-name', source: 'rover', account_name: '' },
          ],
        });
      }

      // Call onSuccess callback if provided
      onSuccess?.();
    } catch (err) {
      alertApi.post({
        message: err instanceof Error ? err.message : 'An error occurred',
        severity: 'error',
        display: 'transient',
      });
    }
  };

  return (
    <Content>
      <Grid container spacing={3}>
        {/* Main Application Details */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Application Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" style={{ marginBottom: 4 }}>
                    Application Name <RequiredAsterisk />
                    <Tooltip title="Enter a unique name for your application.">
                      <InfoIcon
                        fontSize="small"
                        style={{ marginLeft: 4, verticalAlign: 'middle' }}
                      />
                    </Tooltip>
                  </Typography>
                  <TextField
                    label=""
                    fullWidth
                    value={formData.app_name}
                    onChange={handleMainFieldChange('app_name')}
                    required
                    disabled={isEditMode}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" style={{ marginBottom: 4 }}>
                    CMDB ID <RequiredAsterisk />
                    <Tooltip title="Enter the unique CMDB identifier for this application.">
                      <InfoIcon
                        fontSize="small"
                        style={{ marginLeft: 4, verticalAlign: 'middle' }}
                      />
                    </Tooltip>
                  </Typography>
                  <TextField
                    label=""
                    fullWidth
                    value={formData.cmdb_id}
                    onChange={handleMainFieldChange('cmdb_id')}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" style={{ marginBottom: 4 }}>
                    Environment <RequiredAsterisk />
                    <Tooltip title="Specify the environment (e.g., production, staging) for this application.">
                      <InfoIcon
                        fontSize="small"
                        style={{ marginLeft: 4, verticalAlign: 'middle' }}
                      />
                    </Tooltip>
                  </Typography>
                  <TextField
                    label=""
                    fullWidth
                    value={formData.environment}
                    onChange={handleMainFieldChange('environment')}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" style={{ marginBottom: 4 }}>
                    Application Owner <RequiredAsterisk />
                    <Tooltip title="Enter the name or ID of the primary owner for this application.">
                      <InfoIcon
                        fontSize="small"
                        style={{ marginLeft: 4, verticalAlign: 'middle' }}
                      />
                    </Tooltip>
                  </Typography>
                  <TextField
                    label=""
                    fullWidth
                    value={formData.app_owner}
                    onChange={handleMainFieldChange('app_owner')}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" style={{ marginBottom: 4 }}>
                    Application Owner Email <RequiredAsterisk />
                    <Tooltip title="Enter the email address of the application owner.">
                      <InfoIcon
                        fontSize="small"
                        style={{ marginLeft: 4, verticalAlign: 'middle' }}
                      />
                    </Tooltip>
                  </Typography>
                  <TextField
                    label=""
                    fullWidth
                    value={formData.app_owner_email}
                    onChange={handleMainFieldChange('app_owner_email')}
                    required
                    type="email"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" style={{ marginBottom: 4 }}>
                    Application Delegate <RequiredAsterisk />
                    <Tooltip title="Enter the name or ID of the backup/delegate owner for this application.">
                      <InfoIcon
                        fontSize="small"
                        style={{ marginLeft: 4, verticalAlign: 'middle' }}
                      />
                    </Tooltip>
                  </Typography>
                  <TextField
                    label=""
                    fullWidth
                    value={formData.app_delegate}
                    onChange={handleMainFieldChange('app_delegate')}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" style={{ marginBottom: 4 }}>
                    Jira Project <RequiredAsterisk />
                    <Tooltip title="Jira Project should match exactly (case-sensitive) as it appears in the Jira board. Otherwise, the Epic will not be created.">
                      <InfoIcon
                        fontSize="small"
                        style={{ marginLeft: 4, verticalAlign: 'middle' }}
                      />
                    </Tooltip>
                  </Typography>
                  <TextField
                    label=""
                    fullWidth
                    value={formData.jira_project}
                    onChange={handleMainFieldChange('jira_project')}
                    required
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Account Entries Section */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Account Entries
              </Typography>
              {formData.accounts.map((entry, index) => (
                <Fragment key={index}>
                  {index > 0 && <Divider style={{ margin: '16px 0' }} />}
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={3}>
                      <Typography
                        variant="subtitle2"
                        style={{ marginBottom: 4 }}
                      >
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
                        <MenuItem value="rover-group-name">
                          User Accounts
                        </MenuItem>
                        <MenuItem value="service-account">
                          Service Account
                        </MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography
                        variant="subtitle2"
                        style={{ marginBottom: 4 }}
                      >
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
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={5}>
                      <Typography
                        variant="subtitle2"
                        style={{ marginBottom: 4 }}
                      >
                        Account Name <RequiredAsterisk />
                        <Tooltip title="Enter the exact account name (group or service account) as it appears in the source system.">
                          <InfoIcon
                            fontSize="small"
                            style={{ marginLeft: 4, verticalAlign: 'middle' }}
                          />
                        </Tooltip>
                      </Typography>
                      {entry.type === 'rover-group-name' &&
                      entry.source === 'rover' ? (
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
                                  handleAccountChange(
                                    index,
                                    'account_name',
                                    cn,
                                  );
                                  handleMenuClose(index);
                                }}
                              >
                                {cn}
                              </MenuItem>
                            ))}
                          </Menu>
                        </>
                      ) : (
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
                      )}
                    </Grid>
                    <Grid item xs={12} sm={1}>
                      <IconButton
                        color="secondary"
                        onClick={() => handleRemoveAccountEntry(index)}
                        disabled={formData.accounts.length === 1}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Fragment>
              ))}

              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddAccountEntry}
                style={{ marginTop: 16 }}
              >
                Add Account Entry
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Submit Button */}
        <Grid item xs={12}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            size="large"
            fullWidth
          >
            {isEditMode ? 'Update Application' : 'Submit Application'}
          </Button>
        </Grid>
      </Grid>
    </Content>
  );
};
