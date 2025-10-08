import { Content } from '@backstage/core-components';
import {
  alertApiRef,
  discoveryApiRef,
  fetchApiRef,
  identityApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import {
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  TextField,
} from '@material-ui/core';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import AddIcon from '@material-ui/icons/Add';
import CloseIcon from '@material-ui/icons/Close';
import InfoIcon from '@material-ui/icons/Info';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { Fragment, useEffect, useRef, useState } from 'react';
import {
  AccountEntry,
  ApplicationFormData,
  AuditApplicationOnboardingFormProps,
} from './types';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { UserEntity } from '@backstage/catalog-model';
import { getApplicationNameValidationError } from '../../../../utils/applicationNameValidation';

const RequiredAsterisk = () => (
  <span style={{ color: 'red', marginLeft: 2 }}>*</span>
);

// CMDB Codes Input Component
const CMDBCodesInput = ({
  value,
  onChange,
  required = false,
}: {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) => {
  const [inputValue, setInputValue] = useState('');

  // Parse comma-separated string into array
  const cmdbCodes = value
    ? value
        .split(',')
        .map(code => code.trim())
        .filter(code => code)
    : [];

  const handleAddCode = (code: string) => {
    const trimmedCode = code.trim();
    if (trimmedCode && !cmdbCodes.includes(trimmedCode)) {
      const newCodes = [...cmdbCodes, trimmedCode];
      onChange(newCodes.join(', '));
    }
    setInputValue('');
  };

  const handleRemoveCode = (codeToRemove: string) => {
    const newCodes = cmdbCodes.filter(code => code !== codeToRemove);
    onChange(newCodes.join(', '));
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      if (inputValue.trim()) {
        handleAddCode(inputValue);
      }
    }
  };

  return (
    <div>
      <TextField
        label=""
        fullWidth
        required={required}
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Type CMDB code and press Enter or comma"
        helperText="Press Enter or comma to add a code"
        error={required && cmdbCodes.length === 0}
      />
      {cmdbCodes.length > 0 && (
        <div
          style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}
        >
          {cmdbCodes.map((code, index) => (
            <Chip
              key={index}
              label={code}
              onDelete={() => handleRemoveCode(code)}
              deleteIcon={<CloseIcon />}
              color="primary"
              variant="outlined"
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const AuditApplicationOnboardingForm = ({
  onSuccess,
  initialData,
  isEditMode = false,
}: AuditApplicationOnboardingFormProps) => {
  // Use a simple array of {key, value, schema} for jira_metadata
  const [formData, setFormData] = useState<
    Omit<ApplicationFormData, 'jira_metadata'> & {
      jira_metadata: { key: string; value: string; schema?: any }[];
    }
  >(() => {
    // Convert object to array for editing
    const toArray = (obj?: Record<string, string>) =>
      obj
        ? Object.entries(obj).map(([key, value]) => ({
            key,
            value,
            schema: undefined,
          }))
        : [{ key: '', value: '', schema: undefined }];
    if (initialData) {
      return {
        ...initialData,
        jira_metadata: toArray(
          initialData.jira_metadata as Record<string, string>,
        ),
      };
    }
    return {
      app_name: '',
      cmdb_id: '',
      environment: '',
      app_owner: '',
      app_owner_email: '',
      app_delegate: '',
      app_delegate_email: '',
      jira_project: '',
      accounts: [
        { type: 'rover-group-name', source: 'rover', account_name: '' },
      ],
      jira_metadata: [{ key: '', value: '', schema: undefined }],
    };
  });

  // Validation state for application name
  const [appNameError, setAppNameError] = useState<string>('');
  const [isFormValid, setIsFormValid] = useState<boolean>(true);

  // Initial validation for new applications
  useEffect(() => {
    if (!isEditMode && formData.app_name) {
      const error = getApplicationNameValidationError(formData.app_name);
      setAppNameError(error);
      setIsFormValid(!error);
    }
  }, [isEditMode, formData.app_name]);

  useEffect(() => {
    if (initialData) {
      const toArray = (obj?: Record<string, string>) =>
        obj
          ? Object.entries(obj).map(([key, value]) => ({ key, value }))
          : [{ key: '', value: '' }];
      setFormData({
        ...initialData,
        jira_metadata: toArray(
          initialData.jira_metadata as Record<string, string>,
        ),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  const fetchApi = useApi(fetchApiRef);
  const discoveryApi = useApi(discoveryApiRef);
  const alertApi = useApi(alertApiRef);
  const identityApi = useApi(identityApiRef);
  const catalogApi = useApi(catalogApiRef);

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

  // Jira field mapping state
  const [jiraFields, setJiraFields] = useState<
    Array<{
      id: string;
      name: string;
      schema: any;
      custom: boolean;
    }>
  >([]);
  const [jiraFieldsLoading, setJiraFieldsLoading] = useState(false);
  const [jiraFieldsError, setJiraFieldsError] = useState<string | null>(null);

  // Jira projects state
  const [jiraProjects, setJiraProjects] = useState<
    Array<{ key: string; name: string }>
  >([]);
  const [jiraProjectsLoading, setJiraProjectsLoading] = useState(false);
  const [jiraProjectsError, setJiraProjectsError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    async function fetchJiraFields() {
      setJiraFieldsLoading(true);
      setJiraFieldsError(null);
      try {
        const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
        const resp = await fetchApi.fetch(`${baseUrl}/jira/fields`);
        if (resp.ok) {
          const data = await resp.json();
          setJiraFields(data);
        } else {
          setJiraFieldsError('Failed to fetch Jira fields');
          alertApi.post({
            message: 'Failed to fetch Jira fields',
            severity: 'error',
          });
        }
      } catch (err) {
        setJiraFieldsError('Error fetching Jira fields');
        alertApi.post({
          message: 'Error fetching Jira fields',
          severity: 'error',
        });
      } finally {
        setJiraFieldsLoading(false);
      }
    }

    async function fetchJiraProjects() {
      setJiraProjectsLoading(true);
      setJiraProjectsError(null);
      try {
        const proxyUrl = await discoveryApi.getBaseUrl('proxy');
        const response = await fetchApi.fetch(
          `${proxyUrl}/jira/rest/api/2/project`,
        );
        if (response.ok) {
          const data = await response.json();
          setJiraProjects(data);
        } else {
          setJiraProjectsError('Failed to fetch Jira projects');
          alertApi.post({
            message: 'Failed to fetch Jira projects',
            severity: 'error',
          });
        }
      } catch (err) {
        setJiraProjectsError('Error fetching Jira projects');
        alertApi.post({
          message: 'Error fetching Jira projects',
          severity: 'error',
        });
      } finally {
        setJiraProjectsLoading(false);
      }
    }

    fetchJiraFields();
    fetchJiraProjects();
  }, [fetchApi, discoveryApi, alertApi]);

  // User search state for application owner and delegate
  const [ownerSearchValue, setOwnerSearchValue] = useState('');
  const [delegateSearchValue, setDelegateSearchValue] = useState('');
  const [ownerOptions, setOwnerOptions] = useState<UserEntity[]>([]);
  const [delegateOptions, setDelegateOptions] = useState<UserEntity[]>([]);
  const [ownerLoading, setOwnerLoading] = useState(false);
  const [delegateLoading, setDelegateLoading] = useState(false);
  const [selectedDelegates, setSelectedDelegates] = useState<UserEntity[]>([]);

  // Store selected users separately to maintain persistence
  const [selectedOwner, setSelectedOwner] = useState<UserEntity | null>(null);

  // Initialize selected users from form data
  useEffect(() => {
    const initializeUsers = async () => {
      if (initialData?.app_owner) {
        try {
          // Fetch the owner entity directly from catalog
          const ownerResponse = await catalogApi.queryEntities({
            filter: [{ kind: 'User' }],
            fullTextFilter: {
              term: initialData.app_owner,
              fields: ['metadata.name', 'spec.profile.displayName'],
            },
          });
          // Try to find by metadata.name first, then by displayName
          let owner = ownerResponse.items.find(
            (item: any) => item.metadata.name === initialData.app_owner,
          ) as UserEntity;

          if (!owner) {
            // If not found by metadata.name, try by displayName
            owner = ownerResponse.items.find(
              (item: any) =>
                item.spec.profile?.displayName?.toLowerCase() ===
                initialData.app_owner.toLowerCase(),
            ) as UserEntity;
          }

          if (owner) {
            setSelectedOwner(owner);
            setOwnerOptions([owner]);
            // Set the search value to show the selected user
            setOwnerSearchValue(
              owner.spec.profile?.displayName || owner.metadata.name,
            );
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('Error fetching owner entity:', err);
        }
      }

      if (initialData?.app_delegate) {
        try {
          // Handle multiple delegates (comma-separated)
          const delegateNames = initialData.app_delegate
            .split(',')
            .map(name => name.trim());

          // Create entity refs in format user:redhat/<name>
          const entityRefs = delegateNames.map(name => `user:redhat/${name}`);

          // Fetch delegates using getEntitiesByRefs
          const delegateResponse = await catalogApi.getEntitiesByRefs({
            entityRefs: entityRefs,
          });

          // Filter out null results and cast to UserEntity
          const delegates = delegateResponse.items.filter(
            (item): item is UserEntity => item !== null,
          ) as UserEntity[];

          if (delegates.length > 0) {
            setSelectedDelegates(delegates);
            setDelegateOptions(delegates);
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('Failed to fetch delegates:', err);
          // If fetch fails, clear the delegates
          setSelectedDelegates([]);
          setDelegateOptions([]);
        }
      }
    };

    if (initialData && (initialData.app_owner || initialData.app_delegate)) {
      initializeUsers();
    }
  }, [initialData, catalogApi]);

  // Search for users when owner search value changes
  useEffect(() => {
    // Only search if user is actually typing and we have 3+ characters
    if (
      ownerSearchValue.length >= 3 &&
      ownerSearchValue !== selectedOwner?.spec.profile?.displayName
    ) {
      setOwnerLoading(true);
      catalogApi
        .queryEntities({
          filter: [{ kind: 'User' }],
          fullTextFilter: {
            term: ownerSearchValue,
            fields: [
              'spec.profile.displayName',
              'metadata.name',
              'spec.profile.email',
            ],
          },
        })
        .then((res: any) => {
          const searchResults = res.items as UserEntity[];
          // Always include the selected owner in options if it exists
          const allOptions =
            selectedOwner &&
            !searchResults.find(
              u => u.metadata.name === selectedOwner.metadata.name,
            )
              ? [selectedOwner, ...searchResults]
              : searchResults;
          setOwnerOptions(allOptions);
        })
        .catch(() => {
          alertApi.post({
            message: 'Failed to search users',
            severity: 'error',
          });
        })
        .finally(() => {
          setOwnerLoading(false);
        });
    } else if (ownerSearchValue.length === 0) {
      // Keep the selected owner in options if it exists
      if (selectedOwner) {
        setOwnerOptions([selectedOwner]);
      } else {
        setOwnerOptions([]);
      }
    }
  }, [ownerSearchValue, catalogApi, alertApi, selectedOwner]);

  // Search for users when delegate search value changes
  useEffect(() => {
    // Only search if user is actually typing and we have 3+ characters
    if (delegateSearchValue.length >= 3) {
      setDelegateLoading(true);
      catalogApi
        .queryEntities({
          filter: [{ kind: 'User' }],
          fullTextFilter: {
            term: delegateSearchValue,
            fields: [
              'spec.profile.displayName',
              'metadata.name',
              'spec.profile.email',
            ],
          },
        })
        .then((res: any) => {
          const searchResults = res.items as UserEntity[];
          // Filter out already selected delegates
          const filteredResults = searchResults.filter(
            user =>
              !selectedDelegates.find(
                selected => selected.metadata.name === user.metadata.name,
              ),
          );
          setDelegateOptions(filteredResults);
        })
        .catch(() => {
          alertApi.post({
            message: 'Failed to search users',
            severity: 'error',
          });
        })
        .finally(() => {
          setDelegateLoading(false);
        });
    } else if (delegateSearchValue.length === 0) {
      // Clear options when search is empty
      setDelegateOptions([]);
    }
  }, [delegateSearchValue, catalogApi, alertApi, selectedDelegates]);

  // Get display name for user options
  const getUserDisplayName = (user: UserEntity) => {
    return user.spec.profile?.displayName || user.metadata.name;
  };

  // Handle owner selection
  const handleOwnerChange = (selectedUser: UserEntity | null) => {
    if (selectedUser) {
      // Store the full display name for owner
      formData.app_owner = getUserDisplayName(selectedUser);
      formData.app_owner_email = selectedUser.spec.profile?.email || '';
      // Trigger form update
      setFormData({ ...formData });
      setSelectedOwner(selectedUser); // Update selected user state
    }
  };

  // Handle delegate selection (multiple delegates)
  const handleDelegateChange = (selectedUsers: UserEntity[]) => {
    // Store comma-separated delegate names (metadata.name) and emails
    const delegateNames = selectedUsers.map(user => user.metadata.name);
    const delegateEmails = selectedUsers.map(
      user => user.spec.profile?.email || '',
    );

    formData.app_delegate = delegateNames.join(',');
    formData.app_delegate_email = delegateEmails.join(',');

    // Trigger form update
    setFormData({ ...formData });
    setSelectedDelegates(selectedUsers); // Update selected users state
  };

  // Get user option label with email
  const getUserOptionLabel = (user: UserEntity) => {
    const displayName = getUserDisplayName(user);
    const email = user.spec.profile?.email;
    return email ? `${displayName} (${email})` : displayName;
  };

  const handleMainFieldChange =
    (field: keyof Omit<ApplicationFormData, 'accounts'>) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;

      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));

      // Validate application name if it's being changed
      if (field === 'app_name' && !isEditMode) {
        const error = getApplicationNameValidationError(value);
        setAppNameError(error);
        setIsFormValid(!error);
      }
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
    // If options are available, open the menu
    if (groupOptions[index]?.length) {
      setMenuAnchors(anchors => {
        const arr = [...anchors];
        arr[index] = event.currentTarget;
        return arr;
      });
    }
  };

  // Handlers for Jira Metadata (now using dropdown for key)
  const handleJiraMetadataKeyChange = (idx: number, newKey: string) => {
    setFormData(prev => ({
      ...prev,
      jira_metadata: prev.jira_metadata.map((item, i) => {
        if (i === idx) {
          // Find the selected field to get its schema
          const selectedField = jiraFields.find(field => field.id === newKey);
          return {
            ...item,
            key: newKey,
            schema: selectedField?.schema || undefined,
          };
        }
        return item;
      }),
    }));
  };
  const handleJiraMetadataValueChange = (idx: number, newValue: string) => {
    setFormData(prev => ({
      ...prev,
      jira_metadata: prev.jira_metadata.map((item, i) =>
        i === idx ? { ...item, value: newValue } : item,
      ),
    }));
  };
  const handleAddJiraMetadata = () => {
    setFormData(prev => ({
      ...prev,
      jira_metadata: [
        ...prev.jira_metadata,
        { key: '', value: '', schema: undefined },
      ],
    }));
  };
  const handleRemoveJiraMetadata = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      jira_metadata: prev.jira_metadata.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async () => {
    // Validate application name before submitting (only for new applications)
    if (!isEditMode) {
      const error = getApplicationNameValidationError(formData.app_name);
      if (error) {
        setAppNameError(error);
        setIsFormValid(false);
        alertApi.post({
          message:
            'Please fix the application name validation errors before submitting.',
          severity: 'error',
        });
        return;
      }
    }

    try {
      const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
      const endpoint = isEditMode
        ? `/applications/onboarding/${encodeURIComponent(formData.app_name)}`
        : '/applications/onboarding';

      // Get current user identity
      const identity = await identityApi.getBackstageIdentity();
      const currentUser = identity.userEntityRef;

      // Convert jira_metadata array to object for backend with schema information
      const jiraMetadataObj: Record<string, any> = {};
      formData.jira_metadata
        .filter(item => item.key)
        .forEach(item => {
          jiraMetadataObj[item.key] = {
            value: item.value,
            schema: item.schema,
          };
        });
      const payload = {
        ...formData,
        jira_metadata: jiraMetadataObj,
        performed_by: currentUser,
      };

      const response = await fetchApi.fetch(`${baseUrl}${endpoint}`, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
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
          app_delegate_email: '',
          jira_project: '',
          accounts: [
            { type: 'rover-group-name', source: 'rover', account_name: '' },
          ],
          jira_metadata: [{ key: '', value: '', schema: undefined }],
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

  // Helper to render Jira metadata section
  const renderJiraMetadataSection = () => {
    if (jiraFieldsLoading) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CircularProgress size={20} />{' '}
          <Typography color="textSecondary">Loading Jira fields...</Typography>
        </div>
      );
    }
    if (jiraFieldsError) {
      return <Typography color="error">{jiraFieldsError}</Typography>;
    }
    if (jiraFields.length === 0) {
      return (
        <Typography color="textSecondary">No Jira fields found.</Typography>
      );
    }
    if (formData.jira_metadata.length === 0) {
      return (
        <Typography variant="body2" color="textSecondary">
          No Jira metadata fields added yet.
        </Typography>
      );
    }
    return formData.jira_metadata.map((item, idx) => {
      const selectedField = jiraFields.find(field => field.id === item.key);
      return (
        <Grid
          container
          spacing={1}
          alignItems="center"
          key={idx}
          style={{ marginBottom: 8 }}
        >
          <Grid item xs={12} sm={4}>
            <Autocomplete
              options={jiraFields}
              getOptionLabel={field => field.name}
              value={selectedField || undefined}
              onChange={(_, newValue) => {
                handleJiraMetadataKeyChange(idx, newValue ? newValue.id : '');
              }}
              renderInput={params => (
                <TextField
                  {...params}
                  label="Jira Field"
                  variant="outlined"
                  required
                  fullWidth
                  size="small"
                />
              )}
              fullWidth
              disableClearable
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              label="Field ID"
              value={item.key}
              disabled
              fullWidth
              margin="normal"
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Field Value"
              fullWidth
              value={item.value}
              onChange={e => handleJiraMetadataValueChange(idx, e.target.value)}
              required
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={1}>
            <IconButton
              color="secondary"
              onClick={() => handleRemoveJiraMetadata(idx)}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Grid>
        </Grid>
      );
    });
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
                    <Tooltip
                      title={
                        isEditMode
                          ? 'Application name cannot be changed after creation.'
                          : 'Enter a unique name for your application. Only letters, numbers, hyphens (-), and underscores (_) are allowed.'
                      }
                    >
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
                    error={!!appNameError}
                    helperText={
                      appNameError ||
                      (isEditMode
                        ? 'Application name cannot be changed after creation.'
                        : 'Only letters, numbers, hyphens (-), and underscores (_) are allowed.')
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" style={{ marginBottom: 4 }}>
                    CMDB Codes <RequiredAsterisk />
                    <Tooltip title="Enter one or more CMDB identifiers for this application. Press Enter or comma to add multiple codes.">
                      <InfoIcon
                        fontSize="small"
                        style={{ marginLeft: 4, verticalAlign: 'middle' }}
                      />
                    </Tooltip>
                  </Typography>
                  <CMDBCodesInput
                    value={formData.cmdb_id}
                    onChange={value =>
                      setFormData(prev => ({ ...prev, cmdb_id: value }))
                    }
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
                    Jira Project <RequiredAsterisk />
                    <Tooltip title="Select a Jira project from the available projects.">
                      <InfoIcon
                        fontSize="small"
                        style={{ marginLeft: 4, verticalAlign: 'middle' }}
                      />
                    </Tooltip>
                  </Typography>
                  <Autocomplete
                    options={jiraProjects}
                    getOptionLabel={option =>
                      `${option.name?.trim()} (${option.key})`
                    }
                    getOptionSelected={(option, val) => option.key === val.key}
                    value={
                      jiraProjects.find(
                        project => project.key === formData.jira_project,
                      ) || null
                    }
                    onChange={(_event, newValue) => {
                      if (newValue) {
                        setFormData(prev => ({
                          ...prev,
                          jira_project: newValue.key,
                        }));
                      } else {
                        setFormData(prev => ({ ...prev, jira_project: '' }));
                      }
                    }}
                    loading={jiraProjectsLoading}
                    renderInput={params => (
                      <TextField
                        {...params}
                        label=""
                        variant="outlined"
                        required
                        fullWidth
                        size="small"
                        error={!!jiraProjectsError}
                        helperText={
                          jiraProjectsError || 'Select a Jira project'
                        }
                      />
                    )}
                    renderOption={option => (
                      <li>
                        {option.name} ({option.key})
                      </li>
                    )}
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
                  <Autocomplete
                    options={ownerOptions}
                    getOptionLabel={getUserOptionLabel}
                    value={selectedOwner || null}
                    onChange={(_event, newValue) => handleOwnerChange(newValue)}
                    onInputChange={(_event, newInputValue) => {
                      setOwnerSearchValue(newInputValue);
                      // Only clear options if search is empty and no user is selected
                      if (!newInputValue && !selectedOwner) {
                        setOwnerOptions([]);
                      }
                    }}
                    loading={ownerLoading}
                    renderInput={params => (
                      <TextField
                        {...params}
                        label=""
                        variant="outlined"
                        required
                        fullWidth
                        size="small"
                        helperText="Enter at least 3 characters to search (email will be auto-captured)"
                      />
                    )}
                    renderOption={(option: UserEntity, state) => (
                      <li {...state}>{getUserOptionLabel(option)}</li>
                    )}
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
                  <Autocomplete
                    multiple
                    options={delegateOptions}
                    getOptionLabel={getUserOptionLabel}
                    value={selectedDelegates}
                    onChange={(_event, newValue) =>
                      handleDelegateChange(newValue)
                    }
                    onInputChange={(_event, newInputValue) => {
                      setDelegateSearchValue(newInputValue);
                      // Only clear options if search is empty and no users are selected
                      if (!newInputValue && selectedDelegates.length === 0) {
                        setDelegateOptions([]);
                      }
                    }}
                    loading={delegateLoading}
                    renderInput={params => (
                      <TextField
                        {...params}
                        label=""
                        variant="outlined"
                        required
                        fullWidth
                        size="small"
                        helperText="Enter at least 3 characters to search. Select multiple delegates."
                      />
                    )}
                    renderOption={(option: UserEntity, state) => (
                      <li {...state}>{getUserOptionLabel(option)}</li>
                    )}
                    renderTags={(tagValue, getTagProps) =>
                      tagValue.map((option, index) => (
                        <Chip
                          variant="outlined"
                          label={getUserDisplayName(option)}
                          {...getTagProps({ index })}
                          key={option.metadata.name}
                        />
                      ))
                    }
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Jira Metadata Section */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Jira Compulsory Fields (Metadata)
              </Typography>
              <Typography variant="body2" color="error" gutterBottom>
                <b>Tip:</b> These fields are <b>case sensitive</b> and the value
                should match <b>exactly</b> as it is used in Jira. If not, Jira
                issues will not be created.
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Add key-value pairs for compulsory Jira fields. These will be
                stored as metadata.
              </Typography>
              {renderJiraMetadataSection()}
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddJiraMetadata}
                style={{ marginTop: 8 }}
              >
                Add Jira Field
              </Button>
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
                        <CloseIcon />
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
            disabled={!isEditMode && !isFormValid}
          >
            {isEditMode ? 'Update Application' : 'Submit Application'}
          </Button>
        </Grid>
      </Grid>
    </Content>
  );
};
