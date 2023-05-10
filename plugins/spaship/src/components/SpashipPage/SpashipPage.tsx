import React from 'react';
import { useEntity } from '@backstage/plugin-catalog-react';
import { Entity } from '@backstage/catalog-model';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Page, Content, InfoCard } from '@backstage/core-components';
import { MissingAnnotationEmptyState } from '@backstage/core-components';
import {
  useGetActiviyStream,
  useGetDeploymentCountByEnv,
  useGetDeploymentHistoryByMonth,
  useGetDeploymentTime,
} from '../../hooks';
import {
  Divider,
  Grid,
  Typography,
  Button,
  CircularProgress,
} from '@material-ui/core';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ActivityStream } from '../ActivityStream';
import { lineCharts } from '../colorPalette';

const getSpashipConfig = (entity: Entity) => ({
  propertyId: entity.metadata.annotations?.['spaship.io/property-id'],
  appId: entity.metadata.annotations?.['spaship.io/app-id'],
});

const Spaship = () => {
  const { entity } = useEntity();
  const spashipConf = getSpashipConfig(entity);
  const isMissingSpashipConf = !spashipConf.appId || !spashipConf.propertyId;

  const filter = {
    applicationIdentifier: spashipConf.appId,
    propertyIdentifier: spashipConf.propertyId,
  };
  const { data: deploymentCount, isLoading: isDeploymentCountLoading } =
    useGetDeploymentCountByEnv(filter);

  const {
    data: deploymentHistoryByMonth,
    isLoading: isDeploymentHistoryLoading,
  } = useGetDeploymentHistoryByMonth(filter);
  const {
    data: activityStream,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isActivityStreamLoading,
  } = useGetActiviyStream({
    limit: 20,
    ...filter,
  });

  // deployment time
  const { data: deploymentTime30Days } = useGetDeploymentTime(30, filter);
  const { data: deploymentTime90Days } = useGetDeploymentTime(90, filter);
  const { data: deploymentTime180Days } = useGetDeploymentTime(180, filter);
  const { data: deploymentTime365Days } = useGetDeploymentTime(365, filter);
  const deploymentTimes = [
    { label: '30', value: deploymentTime30Days },
    { label: '90', value: deploymentTime90Days },
    { label: '180', value: deploymentTime180Days },
    { label: '365', value: deploymentTime365Days },
  ];

  if (isMissingSpashipConf) {
    return (
      <MissingAnnotationEmptyState
        annotation={['spaship.io/property-id', 'spaship.io/app-id']}
      />
    );
  }

  return (
    <Page themeId="tool">
      <Content>
        <Grid container>
          <Grid item xs={12} md={6}>
            {isDeploymentCountLoading || isDeploymentHistoryLoading ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CircularProgress size="3rem" />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <InfoCard>
                    <Typography variant="h5">Total Deployments</Typography>
                    <Typography variant="h1">
                      {deploymentCount?.total}
                    </Typography>
                    <Divider style={{ marginBottom: '0.5rem' }} />
                    <Grid container spacing={2}>
                      {deploymentCount?.deployments?.map(
                        ({ count, env }, index) => (
                          <Grid item key={`deployment-env-${index + 1}`}>
                            <Typography
                              style={{
                                fontSize: '14px',
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                              }}
                            >
                              {env}
                            </Typography>
                            <Typography style={{ fontSize: '24px' }}>
                              {count}
                            </Typography>
                          </Grid>
                        ),
                      )}
                    </Grid>
                  </InfoCard>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <InfoCard>
                    <Typography variant="h5">Avg. Deployment Time</Typography>
                    <Typography variant="h1">
                      {deploymentTime30Days?.averageTime || 0}s{' '}
                      <span style={{ fontSize: '16px', fontWeight: '400' }}>
                        in past 30 days
                      </span>
                    </Typography>
                    <Divider style={{ marginBottom: '0.5rem' }} />
                    <Grid container spacing={2}>
                      {deploymentTimes.map(({ label, value }, index) => (
                        <Grid item key={`deployment-times-${index + 1}`}>
                          <Typography
                            style={{
                              fontSize: '14px',
                              fontWeight: 'bold',
                              textTransform: 'uppercase',
                            }}
                          >
                            {label} days
                          </Typography>
                          <Typography style={{ fontSize: '24px' }}>
                            {value?.averageTime || 0}s
                          </Typography>
                        </Grid>
                      ))}
                    </Grid>
                  </InfoCard>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <InfoCard>
                    <Typography variant="h5">
                      Total Ephemeral Deployments
                    </Typography>
                    <Typography variant="h1">{deploymentCount?.eph}</Typography>
                  </InfoCard>
                </div>
                <InfoCard title="Deployment History By A Month">
                  <ResponsiveContainer width="100%" height={210}>
                    <LineChart
                      data={deploymentHistoryByMonth}
                      margin={{ top: 20, right: 20, bottom: 5, left: 0 }}
                    >
                      <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                      <Tooltip />
                      <Legend />
                      <XAxis dataKey="date" />
                      {Object.keys(deploymentHistoryByMonth?.[0] || {})
                        .filter(key => key !== 'date')
                        .map((env, index) => (
                          <Line
                            type="monotone"
                            dataKey={env}
                            name={env}
                            key={env}
                            stroke={lineCharts[lineCharts.length % index]}
                          />
                        ))}
                      <YAxis />
                    </LineChart>
                  </ResponsiveContainer>
                </InfoCard>
              </div>
            )}
          </Grid>
          <Grid
            item
            md={6}
            xs={12}
            style={{
              overflowY: 'auto',
              overflowX: 'hidden',
              maxHeight: '1024px',
            }}
          >
            <InfoCard title="Activity Stream">
              {isActivityStreamLoading && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CircularProgress size="3rem" />
                </div>
              )}
              {activityStream?.pages.map((activities, index) => (
                <ActivityStream
                  activities={activities}
                  isGlobal
                  key={`activity-stream-page-${index + 1}`}
                />
              ))}
              <Button
                variant="contained"
                style={{ marginTop: '1rem', width: '100%' }}
                color="primary"
                disabled={!hasNextPage}
                onClick={() => fetchNextPage()}
              >
                {isFetchingNextPage ? (
                  <CircularProgress size="2rem" />
                ) : (
                  'Load more'
                )}
              </Button>
            </InfoCard>
          </Grid>
        </Grid>
      </Content>
    </Page>
  );
};

const queryClient = new QueryClient();

export const SpashipPage = () => (
  <QueryClientProvider client={queryClient}>
    <Spaship />
  </QueryClientProvider>
);
