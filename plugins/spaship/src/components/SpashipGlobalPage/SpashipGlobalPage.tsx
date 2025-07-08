import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Grid,
  Typography,
  Divider,
  Button,
  CircularProgress,
} from '@material-ui/core';
import {
  Page,
  Content,
  Header,
  HeaderLabel,
  InfoCard,
} from '@backstage/core-components';
import { EmptyState } from '../EmptyState';

import {
  useGetDeploymentCountByEnv,
  useGetDeploymentHistoryByMonth,
  useGetDeploymentCountByProperty,
  useGetDeploymentTime,
  useGetActiviyStream,
} from '../../hooks';
import { ActivityStream } from '../ActivityStream';
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
import { lineCharts } from '../colorPalette';
import { configApiRef, useAnalytics, useApi } from '@backstage/core-plugin-api';
import { Center } from '../Center';
import OpenInNew from '@material-ui/icons/OpenInNew';
import { parseEntityRef } from '@backstage/catalog-model';

function isValidEntityRefString(entityRefString: string | undefined) {
  const entityRefPattern = /^(user|group):[a-z0-9-]+\/[a-zA-Z0-9-]+$/;
  return entityRefString && entityRefPattern.test(entityRefString);
}

function getSpashipOwnerUrl(spashipOwner?: string) {
  if (isValidEntityRefString(spashipOwner)) {
    const entityRef = parseEntityRef(spashipOwner!);
    return `/catalog/${entityRef.namespace}/${entityRef.kind}/${entityRef.name}`;
  }
  return '#';
}

export const SpashipGlobal = () => {
  const config = useApi(configApiRef);
  const analytics = useAnalytics();

  const spashipManagerUrl = config.getOptionalString('spaship.managerHost');
  const spashipSlackUrl = config.getOptionalString('spaship.slackUrl');
  const spashipGithubUrl = config.getOptionalString('spaship.githubUrl');
  const spashipContactMail = config.getOptionalString('spaship.contactMail');
  const spashipOwner = config.getOptionalString('spaship.owner');
  const spashipOwnerUrl = getSpashipOwnerUrl(spashipOwner);

  const { data: deploymentCount, isLoading: isDeploymentCountLoading } =
    useGetDeploymentCountByEnv();
  const {
    data: deploymentCountByProperty,
    isLoading: isDeploymentCountByPropertyLoading,
  } = useGetDeploymentCountByProperty();
  const {
    data: activityStream,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isActivityStreamLoading,
  } = useGetActiviyStream();

  const {
    data: deploymentHistoryByMonth,
    isLoading: isDeploymentHistoryByMonthLoading,
  } = useGetDeploymentHistoryByMonth();

  // deployment time
  const { data: deploymentTime30Days } = useGetDeploymentTime();
  const { data: deploymentTime90Days } = useGetDeploymentTime(90);
  const { data: deploymentTime180Days } = useGetDeploymentTime(180);
  const { data: deploymentTime365Days } = useGetDeploymentTime(365);

  const deploymentTimes = [
    { label: '30', value: deploymentTime30Days },
    { label: '90', value: deploymentTime90Days },
    { label: '180', value: deploymentTime180Days },
    { label: '365', value: deploymentTime365Days },
  ];

  const getDeplymentHistoryByMonth = () => {
    return Object.keys(deploymentHistoryByMonth || {})?.length ? (
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
                stroke={lineCharts[index % lineCharts.length]}
              />
            ))}
          <YAxis />
        </LineChart>
      </ResponsiveContainer>
    ) : (
      <Center>
        <EmptyState />
      </Center>
    )
  }

  return (
    <Page themeId="tool">
      <Header
        pageTitleOverride="SPAship"
        title={
          <a
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              width: "fit-content"
            }}
            href={spashipManagerUrl}
          >
            <Typography variant="h4">SPAship</Typography>
            <OpenInNew style={{ fontSize: 14, marginLeft: '0.25rem' }} />
          </a>
        }
        subtitle="Overall Deployment Status"
      >
        {spashipOwner && (
          <HeaderLabel
            label="Owner"
            value={
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={spashipOwnerUrl}
              >
                {spashipOwner?.split('/').pop() ?? spashipOwner}
              </a>
            }
          />
        )}
        {spashipGithubUrl && (
          <HeaderLabel
            label="Github"
            value={
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={spashipGithubUrl}
              >
                @spaship
              </a>
            }
          />
        )}
        {spashipSlackUrl && (
          <HeaderLabel
            label="Slack"
            value={
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={spashipSlackUrl}
              >
                #forum-spaship
              </a>
            }
          />
        )}
        {spashipContactMail && (
          <HeaderLabel
            label="Mail"
            value={
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={spashipContactMail}
              >
                #spaship
              </a>
            }
          />
        )}
      </Header>
      <Content>
        <Grid container>
          <Grid item xs={12} md={6}>
            {isDeploymentCountLoading || isDeploymentCountByPropertyLoading ? (
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
                      {deploymentTime30Days?.averageTime}s{' '}
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
                            {value?.averageTime}s
                          </Typography>
                        </Grid>
                      ))}
                    </Grid>
                  </InfoCard>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <InfoCard>
                    <Typography variant="h5">Total Properties</Typography>
                    <Typography variant="h1">
                      {deploymentCountByProperty?.length}
                    </Typography>
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
                <InfoCard title="Deployment History For Last 30 Days">
                  {isDeploymentHistoryByMonthLoading ? (
                    <Center>
                      <CircularProgress size={64} />
                    </Center>
                  ) : getDeplymentHistoryByMonth() }
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
                  spashipUrl={spashipManagerUrl}
                  activities={activities}
                  isGlobal
                  key={`activity-stream-page-${index + 1}`}
                />
              ))}
              <Button
                variant="contained"
                style={{ marginTop: '2rem', width: '100%' }}
                color="primary"
                disabled={!hasNextPage || isFetchingNextPage}
                onClick={() => {
                  fetchNextPage();
                  analytics.captureEvent('click', 'load more');
                }}
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
export const SpashipGlobalPage = () => (
  <QueryClientProvider client={queryClient}>
    <SpashipGlobal />
  </QueryClientProvider>
);
