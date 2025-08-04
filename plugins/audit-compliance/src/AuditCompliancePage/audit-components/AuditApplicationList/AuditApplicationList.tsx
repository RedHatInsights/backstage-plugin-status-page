import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Content,
  InfoCard,
  Page,
  Progress,
  ResponseErrorPanel,
  EmptyState,
} from '@backstage/core-components';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
  Box,
  CircularProgress,
} from '@material-ui/core';
import Group from '@material-ui/icons/Group';
import AddIcon from '@material-ui/icons/Add';
import CloseIcon from '@material-ui/icons/Close';
import InfoIcon from '@material-ui/icons/Info';
import EditIcon from '@material-ui/icons/Edit';
import { useStyles } from './AuditApplicationList.styles';
import { useApi } from '@backstage/core-plugin-api';
import { discoveryApiRef, fetchApiRef } from '@backstage/core-plugin-api';
import { Application } from './types';
import { capitalize } from 'lodash';
import { AuditApplicationOnboardingForm } from './AuditApplicationOnboardingForm/AuditApplicationOnboardingForm';
import { ApplicationFormData } from './AuditApplicationOnboardingForm/types';

// Utility to convert hyphen-case to title case with 'and' capitalized
export function formatDisplayName(name: string) {
  if (!name) return '';
  return name
    .split('-')
    .map(word =>
      word.toLowerCase() === 'and'
        ? 'and'
        : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(' ')
    .replace(/\bAnd\b/g, 'and'); // ensure 'and' is not capitalized
}

interface AccountEntry {
  type: 'service-account' | 'rover-group-name';
  source: 'rover' | 'gitlab' | 'ldap';
  account_name: string;
}

interface ApplicationDetails {
  app_name: string;
  cmdb_id: string;
  environment: string;
  app_owner: string;
  app_delegate: string;
  jira_project: string;
  app_owner_email: string;
  accounts: AccountEntry[];
  jira_metadata?: Record<string, string>;
}

export function AuditApplicationList() {
  const classes = useStyles();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [selectedAppDetails, setSelectedAppDetails] =
    useState<ApplicationDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<ApplicationFormData | null>(
    null,
  );
  const [jiraFields, setJiraFields] = useState<{ [id: string]: string }>({});
  const [jiraFieldsLoading, setJiraFieldsLoading] = useState(false);
  const [jiraFieldsError, setJiraFieldsError] = useState<string | null>(null);

  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
      const response = await fetchApi.fetch(`${baseUrl}/applications`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error fetching applications: ${response.statusText}`);
      }

      const data = await response.json();
      setApplications(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicationDetails = async (appName: string) => {
    try {
      setDetailsLoading(true);
      const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
      const response = await fetchApi.fetch(
        `${baseUrl}/application-details/${appName}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `Error fetching application details: ${response.statusText}`,
        );
      }

      const data = await response.json();
      setSelectedAppDetails(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleViewDetails = (appName: string) => {
    setSelectedAppDetails(null); // Clear old data before fetching
    fetchApplicationDetails(appName);
    setIsSidePanelOpen(true);
  };

  const handleCloseSidePanel = () => {
    setIsSidePanelOpen(false);
    setSelectedAppDetails(null);
  };

  const getAccountDisplayText = (accounts: string[], type: string) => {
    if (accounts.length > 0) {
      return accounts.join(', ');
    }
    return `No ${type} accounts`;
  };

  const convertApiDataToFormData = (
    apiData: ApplicationDetails & { jira_metadata?: Record<string, any> },
  ): ApplicationFormData => {
    // Convert transformed metadata back to raw values for the form
    const rawMetadata: Record<string, string> = {};
    if (apiData.jira_metadata) {
      Object.entries(apiData.jira_metadata).forEach(([key, value]) => {
        if (typeof value === 'string') {
          rawMetadata[key] = value;
        } else if (typeof value === 'object' && value !== null) {
          const objValue = value as any;
          if (objValue.name) {
            rawMetadata[key] = objValue.name;
          } else if (objValue.value) {
            rawMetadata[key] = objValue.value;
          } else if (Array.isArray(value)) {
            rawMetadata[key] = (value as any[])
              .map((item: any) =>
                typeof item === 'string' ? item : item.name || item.value || '',
              )
              .filter(Boolean)
              .join(',');
          } else {
            rawMetadata[key] = JSON.stringify(value);
          }
        } else {
          rawMetadata[key] = String(value);
        }
      });
    }

    return {
      app_name: apiData.app_name,
      cmdb_id: apiData.cmdb_id,
      environment: apiData.environment,
      app_owner: apiData.app_owner,
      app_owner_email: apiData.app_owner_email,
      app_delegate: apiData.app_delegate,
      jira_project: apiData.jira_project,
      accounts:
        apiData.accounts && apiData.accounts.length > 0
          ? apiData.accounts
          : [{ type: 'rover-group-name', source: 'rover', account_name: '' }],
      jira_metadata: rawMetadata,
    };
  };

  const handleEditApplication = async () => {
    if (!selectedAppDetails?.app_name) return;
    setEditFormData(null); // Clear old form data
    setDetailsLoading(true);
    try {
      const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
      const response = await fetchApi.fetch(
        `${baseUrl}/application-details/${selectedAppDetails.app_name}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        },
      );
      if (!response.ok)
        throw new Error('Failed to fetch latest application details');
      const data = await response.json();
      setEditFormData(convertApiDataToFormData(data));
      setIsEditModalOpen(true);
      setIsSidePanelOpen(false); // Close the drawer when editing
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setEditFormData(null);
    fetchApplications(); // Refresh the applications list
  };

  useEffect(() => {
    async function fetchJiraFields() {
      setJiraFieldsLoading(true);
      setJiraFieldsError(null);
      try {
        const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
        const resp = await fetchApi.fetch(`${baseUrl}/jira/fields`);
        if (resp.ok) {
          const data = await resp.json();
          // Convert array of field objects to id -> name mapping
          const fieldMapping: { [id: string]: string } = {};
          data.forEach((field: any) => {
            if (field.id && field.name) {
              fieldMapping[field.id] = field.name;
            }
          });
          setJiraFields(fieldMapping);
        } else {
          setJiraFieldsError('Failed to fetch Jira fields');
        }
      } catch (err) {
        setJiraFieldsError('Error fetching Jira fields');
      } finally {
        setJiraFieldsLoading(false);
      }
    }
    fetchJiraFields();
  }, [fetchApi, discoveryApi]);

  // Helper to render Jira metadata fields with labels
  const renderJiraMetadataFields = () => {
    if (
      !selectedAppDetails ||
      !selectedAppDetails.jira_metadata ||
      typeof selectedAppDetails.jira_metadata !== 'object'
    )
      return null;
    if (jiraFieldsLoading) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CircularProgress size={18} />
          <span>Loading Jira fields...</span>
        </div>
      );
    }
    if (jiraFieldsError) {
      return <span style={{ color: 'red' }}>{jiraFieldsError}</span>;
    }
    return (
      <div>
        {Object.entries(selectedAppDetails.jira_metadata).map(
          ([key, value]) => {
            // Handle different value formats
            let displayValue = '';
            if (typeof value === 'string') {
              displayValue = value;
            } else if (typeof value === 'object' && value !== null) {
              const objValue = value as any;
              if (objValue.name) {
                displayValue = objValue.name;
              } else if (objValue.value) {
                displayValue = objValue.value;
              } else if (Array.isArray(value)) {
                displayValue = (value as any[])
                  .map((item: any) =>
                    typeof item === 'string'
                      ? item
                      : item.name || item.value || JSON.stringify(item),
                  )
                  .join(', ');
              } else {
                displayValue = JSON.stringify(value);
              }
            } else {
              displayValue = String(value);
            }

            return (
              <div
                key={key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: 4,
                }}
              >
                <span style={{ fontWeight: 500, marginRight: 8 }}>
                  {jiraFields[key] || key}:
                </span>
                <span>{displayValue}</span>
              </div>
            );
          },
        )}
      </div>
    );
  };

  const renderDrawerContent = () => {
    if (detailsLoading) {
      return (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="200px"
        >
          <CircularProgress />
        </Box>
      );
    }

    if (!selectedAppDetails) {
      return (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="200px"
        >
          <Typography color="textSecondary">No details available</Typography>
        </Box>
      );
    }

    return (
      <List>
        <ListItem>
          <ListItemText
            primary="Application Name"
            secondary={formatDisplayName(selectedAppDetails.app_name)}
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="CMDB ID"
            secondary={selectedAppDetails.cmdb_id}
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="Environment"
            secondary={capitalize(selectedAppDetails.environment)}
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="Application Owner"
            secondary={selectedAppDetails.app_owner}
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="Application Delegate"
            secondary={selectedAppDetails.app_delegate}
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="Jira Project"
            secondary={selectedAppDetails.jira_project}
          />
        </ListItem>
        {/* Jira Metadata Section */}
        {selectedAppDetails.jira_metadata &&
          Object.keys(selectedAppDetails.jira_metadata).length > 0 && (
            <ListItem alignItems="flex-start">
              <ListItemText
                primary="Jira Metadata Fields"
                secondary={renderJiraMetadataFields()}
              />
            </ListItem>
          )}
        <ListItem>
          <ListItemText
            primary="Owner Email"
            secondary={selectedAppDetails.app_owner_email}
          />
        </ListItem>
        <Divider />
        <ListItem>
          <ListItemText
            primary="User Accounts"
            secondary={
              <div>
                <div>
                  <strong>Rover:</strong>{' '}
                  {getAccountDisplayText(
                    selectedAppDetails.accounts
                      .filter(
                        acc =>
                          acc.type === 'rover-group-name' &&
                          acc.source === 'rover',
                      )
                      .map(acc => acc.account_name),
                    'Rover',
                  )}
                </div>
                <div>
                  <strong>GitLab:</strong>{' '}
                  {getAccountDisplayText(
                    selectedAppDetails.accounts
                      .filter(
                        acc =>
                          acc.type === 'rover-group-name' &&
                          acc.source === 'gitlab',
                      )
                      .map(acc => acc.account_name),
                    'GitLab',
                  )}
                </div>
                <div>
                  <strong>LDAP:</strong>{' '}
                  {getAccountDisplayText(
                    selectedAppDetails.accounts
                      .filter(
                        acc =>
                          acc.type === 'rover-group-name' &&
                          acc.source === 'ldap',
                      )
                      .map(acc => acc.account_name),
                    'LDAP',
                  )}
                </div>
              </div>
            }
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="Service Accounts"
            secondary={
              <div>
                <div>
                  <strong>Rover:</strong>{' '}
                  {getAccountDisplayText(
                    selectedAppDetails.accounts
                      .filter(
                        acc =>
                          acc.type === 'service-account' &&
                          acc.source === 'rover',
                      )
                      .map(acc => acc.account_name),
                    'Rover',
                  )}
                </div>
                <div>
                  <strong>GitLab:</strong>{' '}
                  {getAccountDisplayText(
                    selectedAppDetails.accounts
                      .filter(
                        acc =>
                          acc.type === 'service-account' &&
                          acc.source === 'gitlab',
                      )
                      .map(acc => acc.account_name),
                    'GitLab',
                  )}
                </div>
                <div>
                  <strong>LDAP:</strong>{' '}
                  {getAccountDisplayText(
                    selectedAppDetails.accounts
                      .filter(
                        acc =>
                          acc.type === 'service-account' &&
                          acc.source === 'ldap',
                      )
                      .map(acc => acc.account_name),
                    'LDAP',
                  )}
                </div>
              </div>
            }
          />
        </ListItem>
      </List>
    );
  };

  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discoveryApi, fetchApi]);

  const handleFormSuccess = () => {
    setIsModalOpen(false); // Close the modal
    fetchApplications(); // Refresh the applications list
  };

  if (loading) {
    return <Progress />;
  }

  if (error) {
    return <ResponseErrorPanel error={error} />;
  }

  return (
    <Page themeId="tool">
      <Content>
        <InfoCard
          title="Applications for Audit"
          variant="fullHeight"
          action={
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setIsModalOpen(true)}
            >
              Add Application
            </Button>
          }
        >
          {applications.length === 0 ? (
            <EmptyState
              missing="data"
              title="No applications found for audit"
              description="You haven't added any applications for audit yet. Click the 'Add Application' button to start auditing your first application."
              action={
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => setIsModalOpen(true)}
                >
                  Add App for Audit
                </Button>
              }
            />
          ) : (
            <Grid container spacing={3}>
              {applications.map(app => (
                <Grid item xs={12} sm={6} md={4} key={app.id}>
                  <Card className={classes.card}>
                    <CardContent className={classes.cardContent}>
                      <div className={classes.cardTitleRow}>
                        <Group fontSize="small" />
                        <Typography className={classes.cardTitle}>
                          {formatDisplayName(app.app_name)}
                        </Typography>
                      </div>

                      <Typography className={classes.cardText}>
                        Owner: {capitalize(app.app_owner)}
                      </Typography>

                      <Chip
                        label={capitalize(app.cmdb_id)}
                        className={classes.chip}
                        size="small"
                      />

                      <div className={classes.spacer} />

                      <div className={classes.buttonContainer}>
                        <Button
                          variant="outlined"
                          color="primary"
                          className={classes.button}
                          onClick={() =>
                            navigate(`/audit-access-manager/${app.app_name}`)
                          }
                        >
                          More Details
                        </Button>
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => handleViewDetails(app.app_name)}
                          title="View Onboarded Details"
                        >
                          <InfoIcon />
                        </IconButton>
                      </div>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </InfoCard>

        <Dialog
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Add New Application
            <IconButton
              aria-label="close"
              onClick={() => setIsModalOpen(false)}
              style={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <AuditApplicationOnboardingForm onSuccess={handleFormSuccess} />
          </DialogContent>
        </Dialog>

        <Drawer
          anchor="right"
          open={isSidePanelOpen}
          onClose={handleCloseSidePanel}
          classes={{
            paper: classes.drawerPaper,
          }}
        >
          <Box className={classes.drawerHeader}>
            <Typography variant="h6">Application Details</Typography>
            <div style={{ display: 'flex', gap: '8px' }}>
              <IconButton
                onClick={handleEditApplication}
                title="Edit Application"
                color="primary"
              >
                <EditIcon />
              </IconButton>
              <IconButton onClick={handleCloseSidePanel}>
                <CloseIcon />
              </IconButton>
            </div>
          </Box>
          <Divider />
          <Box className={classes.drawerContent}>
            {selectedAppDetails && (
              <Typography
                variant="h5"
                style={{ marginBottom: 16, fontWeight: 600 }}
              >
                {formatDisplayName(selectedAppDetails.app_name)}
              </Typography>
            )}
            {renderDrawerContent()}
          </Box>
        </Drawer>

        {/* Edit Application Modal */}
        <Dialog
          open={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Edit Application
            {editFormData?.app_name ? `: ${editFormData.app_name}` : ''}
            <IconButton
              aria-label="close"
              onClick={() => setIsEditModalOpen(false)}
              style={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            {editFormData && (
              <AuditApplicationOnboardingForm
                onSuccess={handleEditSuccess}
                initialData={editFormData}
                isEditMode
              />
            )}
          </DialogContent>
        </Dialog>
      </Content>
    </Page>
  );
}
