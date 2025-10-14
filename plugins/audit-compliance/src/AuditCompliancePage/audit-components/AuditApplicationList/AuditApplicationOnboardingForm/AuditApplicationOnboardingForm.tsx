import { Content } from '@backstage/core-components';
import {
  alertApiRef,
  discoveryApiRef,
  fetchApiRef,
  identityApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import { Button, Grid } from '@material-ui/core';
import { useEffect, useState } from 'react';
import {
  ApplicationFormData,
  AuditApplicationOnboardingFormProps,
} from './types';
import { UserEntity } from '@backstage/catalog-model';
import { getApplicationNameValidationError } from '../../../../utils/applicationNameValidation';
import { ApplicationDetailsSection } from './ApplicationDetailsSection';
import { JiraMetadataSection } from './JiraMetadataSection';
import { AccountEntriesSection } from './AccountEntriesSection';

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
        {
          type: 'rover-group-name',
          source: 'rover',
          account_name: '',
          custom_reviewer: '',
        },
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

  // Handler functions for child components
  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleOwnerChange = (_user: UserEntity | null) => {
    // Owner change is handled by the ApplicationDetailsSection component
  };

  const handleDelegateChange = (_users: UserEntity[]) => {
    // Delegate change is handled by the ApplicationDetailsSection component
  };

  const handleAppNameValidation = (error: string, isValid: boolean) => {
    setAppNameError(error);
    setIsFormValid(isValid);
  };

  const handleJiraMetadataChange = (
    metadata: { key: string; value: string; schema?: any }[],
  ) => {
    setFormData(prev => ({
      ...prev,
      jira_metadata: metadata,
    }));
  };

  const handleAccountsChange = (accounts: any[]) => {
    setFormData(prev => ({
      ...prev,
      accounts: accounts,
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
            {
              type: 'rover-group-name',
              source: 'rover',
              account_name: '',
              custom_reviewer: '',
            },
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

  return (
    <Content>
      <Grid container spacing={3}>
        {/* Main Application Details */}
        <Grid item xs={12}>
          <ApplicationDetailsSection
            formData={{
              app_name: formData.app_name,
              cmdb_id: formData.cmdb_id,
              environment: formData.environment,
              app_owner: formData.app_owner,
              app_owner_email: formData.app_owner_email,
              app_delegate: formData.app_delegate,
              app_delegate_email: formData.app_delegate_email,
              jira_project: formData.jira_project,
            }}
            isEditMode={isEditMode}
            appNameError={appNameError}
            isFormValid={isFormValid}
            onFieldChange={handleFieldChange}
            onOwnerChange={handleOwnerChange}
            onDelegateChange={handleDelegateChange}
            onAppNameValidation={handleAppNameValidation}
          />
        </Grid>

        {/* Jira Metadata Section */}
        <Grid item xs={12}>
          <JiraMetadataSection
            jiraMetadata={formData.jira_metadata}
            onJiraMetadataChange={handleJiraMetadataChange}
          />
        </Grid>

        {/* Account Entries Section */}
        <Grid item xs={12}>
          <AccountEntriesSection
            accounts={formData.accounts}
            onAccountsChange={handleAccountsChange}
          />
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
