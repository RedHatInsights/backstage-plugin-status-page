import {
  alertApiRef,
  discoveryApiRef,
  fetchApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import {
  Card,
  CardContent,
  Chip,
  Grid,
  TextField,
  Typography,
} from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
import Tooltip from '@material-ui/core/Tooltip';
import InfoIcon from '@material-ui/icons/Info';
import { useEffect, useState } from 'react';
import { UserEntity } from '@backstage/catalog-model';
import { getApplicationNameValidationError } from '../../../../utils/applicationNameValidation';
import { CMDBCodesInput } from './CMDBCodesInput';

const RequiredAsterisk = () => (
  <span style={{ color: 'red', marginLeft: 2 }}>*</span>
);

interface ApplicationDetailsSectionProps {
  formData: {
    app_name: string;
    cmdb_id: string;
    environment: string;
    app_owner: string;
    app_owner_email: string;
    app_delegate: string;
    app_delegate_email: string;
    jira_project: string;
  };
  isEditMode: boolean;
  appNameError: string;
  isFormValid: boolean;
  onFieldChange: (field: string, value: string) => void;
  onOwnerChange: (user: UserEntity | null) => void;
  onDelegateChange: (users: UserEntity[]) => void;
  onAppNameValidation: (error: string, isValid: boolean) => void;
}

export const ApplicationDetailsSection = ({
  formData,
  isEditMode,
  appNameError,
  onFieldChange,
  onOwnerChange,
  onDelegateChange,
  onAppNameValidation,
}: ApplicationDetailsSectionProps) => {
  const fetchApi = useApi(fetchApiRef);
  const discoveryApi = useApi(discoveryApiRef);
  const alertApi = useApi(alertApiRef);
  const catalogApi = useApi(catalogApiRef);

  // Jira projects state
  const [jiraProjects, setJiraProjects] = useState<
    Array<{ key: string; name: string }>
  >([]);
  const [jiraProjectsLoading, setJiraProjectsLoading] = useState(false);
  const [jiraProjectsError, setJiraProjectsError] = useState<string | null>(
    null,
  );

  // User search state for application owner and delegate
  const [ownerSearchValue, setOwnerSearchValue] = useState('');
  const [delegateSearchValue, setDelegateSearchValue] = useState('');
  const [ownerOptions, setOwnerOptions] = useState<UserEntity[]>([]);
  const [delegateOptions, setDelegateOptions] = useState<UserEntity[]>([]);
  const [ownerLoading, setOwnerLoading] = useState(false);
  const [delegateLoading, setDelegateLoading] = useState(false);
  const [selectedDelegates, setSelectedDelegates] = useState<UserEntity[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<UserEntity | null>(null);

  // Fetch Jira projects
  useEffect(() => {
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

    fetchJiraProjects();
  }, [fetchApi, discoveryApi, alertApi]);

  // Initialize selected users from form data
  useEffect(() => {
    const initializeUsers = async () => {
      if (formData.app_owner) {
        try {
          const ref = `user:redhat/${formData.app_owner}`;
          const entity = await catalogApi.getEntityByRef(ref);
          let owner =
            entity && entity.kind === 'User' ? (entity as UserEntity) : null;

          if (!owner) {
            const ownerResponse = await catalogApi.queryEntities({
              filter: [{ kind: 'User' }],
              fullTextFilter: {
                term: formData.app_owner,
                fields: [
                  'metadata.name',
                  'spec.profile.displayName',
                  'spec.profile.email',
                ],
              },
            });

            owner =
              (ownerResponse.items.find(
                (item: any) => item.metadata.name === formData.app_owner,
              ) as UserEntity) ||
              (ownerResponse.items.find(
                (item: any) =>
                  item.spec.profile?.displayName?.toLowerCase() ===
                  formData.app_owner.toLowerCase(),
              ) as UserEntity) ||
              (ownerResponse.items.find(
                (item: any) =>
                  item.spec.profile?.email?.toLowerCase() ===
                  formData.app_owner.toLowerCase(),
              ) as UserEntity);
          }

          if (owner) {
            setSelectedOwner(owner);
            setOwnerOptions([owner]);
            setOwnerSearchValue(
              owner.spec.profile?.displayName || owner.metadata.name,
            );
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('Error fetching owner entity:', err);
        }
      }

      if (formData.app_delegate) {
        try {
          const delegateNames = formData.app_delegate
            .split(',')
            .map(name => name.trim());
          const entityRefs = delegateNames.map(name => `user:redhat/${name}`);
          const delegateResponse = await catalogApi.getEntitiesByRefs({
            entityRefs: entityRefs,
          });
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
          setSelectedDelegates([]);
          setDelegateOptions([]);
        }
      }
    };

    if (formData.app_owner || formData.app_delegate) {
      initializeUsers();
    }
  }, [formData.app_owner, formData.app_delegate, catalogApi]);

  // Search for users when owner search value changes
  useEffect(() => {
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
      if (selectedOwner) {
        setOwnerOptions([selectedOwner]);
      } else {
        setOwnerOptions([]);
      }
    }
  }, [ownerSearchValue, catalogApi, alertApi, selectedOwner]);

  // Search for users when delegate search value changes
  useEffect(() => {
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
      setDelegateOptions([]);
    }
  }, [delegateSearchValue, catalogApi, alertApi, selectedDelegates]);

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

  // Handle owner selection
  const handleOwnerChange = (selectedUser: UserEntity | null) => {
    if (selectedUser) {
      onFieldChange('app_owner', getUserDisplayName(selectedUser));
      onFieldChange('app_owner_email', selectedUser.spec.profile?.email || '');
      setSelectedOwner(selectedUser);
    }
    onOwnerChange(selectedUser);
  };

  // Handle delegate selection (multiple delegates)
  const handleDelegateChange = (selectedUsers: UserEntity[]) => {
    const delegateNames = selectedUsers.map(user => user.metadata.name);
    const delegateEmails = selectedUsers.map(
      user => user.spec.profile?.email || '',
    );

    onFieldChange('app_delegate', delegateNames.join(','));
    onFieldChange('app_delegate_email', delegateEmails.join(','));
    setSelectedDelegates(selectedUsers);
    onDelegateChange(selectedUsers);
  };

  const handleMainFieldChange =
    (field: keyof typeof formData) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      onFieldChange(field, value);

      // Validate application name if it's being changed
      if (field === 'app_name' && !isEditMode) {
        const error = getApplicationNameValidationError(value);
        onAppNameValidation(error, !error);
      }
    };

  return (
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
                    : 'Enter a unique name for your application. Only letters, numbers, hyphens (-), underscores (_), and spaces are allowed.'
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
                  : 'Only letters, numbers, hyphens (-), underscores (_), and spaces are allowed.')
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
              onChange={value => onFieldChange('cmdb_id', value)}
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
                  onFieldChange('jira_project', newValue.key);
                } else {
                  onFieldChange('jira_project', '');
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
                  helperText={jiraProjectsError || 'Select a Jira project'}
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
              onChange={(_event, newValue) => handleDelegateChange(newValue)}
              onInputChange={(_event, newInputValue) => {
                setDelegateSearchValue(newInputValue);
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
  );
};
