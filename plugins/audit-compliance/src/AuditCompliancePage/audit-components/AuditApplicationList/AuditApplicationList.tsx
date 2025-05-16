import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Content,
  InfoCard,
  Page,
  Progress,
  ResponseErrorPanel,
} from '@backstage/core-components';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
} from '@material-ui/core';
import Group from '@material-ui/icons/Group';
import { useStyles } from './AuditApplicationList.styles';
import { useApi } from '@backstage/core-plugin-api';
import { discoveryApiRef, fetchApiRef } from '@backstage/core-plugin-api';
import { Application } from './types';
import { capitalize } from 'lodash';

export function AuditApplicationList() {
  const classes = useStyles();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | undefined>(undefined);

  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
        const response = await fetchApi.fetch(`${baseUrl}/applications`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(
            `Error fetching applications: ${response.statusText}`,
          );
        }

        const data = await response.json();
        setApplications(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [discoveryApi, fetchApi]);

  if (loading) {
    return <Progress />;
  }

  if (error) {
    return <ResponseErrorPanel error={error} />;
  }

  return (
    <Page themeId="tool">
      <Content>
        <InfoCard title="Applications for Audit" variant="fullHeight">
          <Grid container spacing={3}>
            {applications.map(app => (
              <Grid item xs={12} sm={6} md={4} key={app.id}>
                <Card className={classes.card}>
                  <CardContent className={classes.cardContent}>
                    <div className={classes.cardTitleRow}>
                      <Group fontSize="small" />
                      <Typography className={classes.cardTitle}>
                        {app.app_name}
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
        </InfoCard>
      </Content>
    </Page>
  );
}
