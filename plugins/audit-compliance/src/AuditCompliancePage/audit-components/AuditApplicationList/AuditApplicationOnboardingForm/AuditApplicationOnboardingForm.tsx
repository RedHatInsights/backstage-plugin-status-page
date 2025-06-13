import { Content } from '@backstage/core-components';
import {
  alertApiRef,
  discoveryApiRef,
  fetchApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import {
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from '@material-ui/core';
import React, { useState } from 'react';
import {
  AccountEntry,
  ApplicationFormData,
  AuditApplicationOnboardingFormProps,
} from './types';

export const AuditApplicationOnboardingForm = ({
  onSuccess,
}: AuditApplicationOnboardingFormProps) => {
  const [formData, setFormData] = useState<ApplicationFormData>({
    app_name: '',
    cmdb_id: '',
    environment: '',
    app_owner: '',
    app_delegate: '',
    jira_project: '',
    accounts: [{ type: 'service-account', source: 'rover', account_name: '' }],
  });

  const fetchApi = useApi(fetchApiRef);
  const discoveryApi = useApi(discoveryApiRef);
  const alertApi = useApi(alertApiRef);

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
        { type: 'service-account', source: 'rover', account_name: '' },
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

  const handleSubmit = async () => {
    try {
      const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
      const response = await fetchApi.fetch(
        `${baseUrl}/applications/onboarding`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        },
      );

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
        throw new Error(errorData.error || 'Failed to create application');
      }

      alertApi.post({
        message: 'Application created successfully!',
        severity: 'success',
        display: 'transient',
      });

      // Reset form after successful submission
      setFormData({
        app_name: '',
        cmdb_id: '',
        environment: '',
        app_owner: '',
        app_delegate: '',
        jira_project: '',
        accounts: [
          { type: 'service-account', source: 'rover', account_name: '' },
        ],
      });

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
                  <TextField
                    label="Application Name"
                    fullWidth
                    value={formData.app_name}
                    onChange={handleMainFieldChange('app_name')}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="CMDB ID"
                    fullWidth
                    value={formData.cmdb_id}
                    onChange={handleMainFieldChange('cmdb_id')}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Environment"
                    fullWidth
                    value={formData.environment}
                    onChange={handleMainFieldChange('environment')}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Application Owner"
                    fullWidth
                    value={formData.app_owner}
                    onChange={handleMainFieldChange('app_owner')}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Application Delegate"
                    fullWidth
                    value={formData.app_delegate}
                    onChange={handleMainFieldChange('app_delegate')}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Jira Project"
                    fullWidth
                    value={formData.jira_project}
                    onChange={handleMainFieldChange('jira_project')}
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
                <React.Fragment key={index}>
                  {index > 0 && <Divider style={{ margin: '16px 0' }} />}
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={3}>
                      <TextField
                        select
                        label="Type"
                        fullWidth
                        value={entry.type}
                        onChange={e =>
                          handleAccountChange(index, 'type', e.target.value)
                        }
                        required
                      >
                        <MenuItem value="service-account">
                          Service Account
                        </MenuItem>
                        <MenuItem value="rover-group-name">
                          Rover Group
                        </MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        select
                        label="Source"
                        fullWidth
                        value={entry.source}
                        onChange={e =>
                          handleAccountChange(index, 'source', e.target.value)
                        }
                        required
                      >
                        <MenuItem value="rover">Rover</MenuItem>
                        <MenuItem value="gitlab">GitLab</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={5}>
                      <TextField
                        label="Account Name"
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
                </React.Fragment>
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
            Submit Application
          </Button>
        </Grid>
      </Grid>
    </Content>
  );
};
