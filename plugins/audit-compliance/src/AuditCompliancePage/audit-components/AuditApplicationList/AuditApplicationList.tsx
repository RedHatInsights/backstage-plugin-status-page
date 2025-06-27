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
} from '@material-ui/core';
import Group from '@material-ui/icons/Group';
import AddIcon from '@material-ui/icons/Add';
import CloseIcon from '@material-ui/icons/Close';
import { useStyles } from './AuditApplicationList.styles';
import { useApi } from '@backstage/core-plugin-api';
import { discoveryApiRef, fetchApiRef } from '@backstage/core-plugin-api';
import { Application } from './types';
import { capitalize } from 'lodash';
import { AuditApplicationOnboardingForm } from './AuditApplicationOnboardingForm/AuditApplicationOnboardingForm';

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

export function AuditApplicationList() {
  const classes = useStyles();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
                            navigate(`/audit-compliance/${app.app_name}`)
                          }
                        >
                          More Details
                        </Button>
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
      </Content>
    </Page>
  );
}
