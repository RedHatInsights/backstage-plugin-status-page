import { useEffect, useState } from 'react';
import {
  Grid,
  Typography,
  Divider,
  LinearProgress,
  Chip,
  Avatar,
  Tooltip,
} from '@material-ui/core';
import { InfoCard } from '@backstage/core-components';
import { devexApiRef } from '../../api';
import { useApi } from '@backstage/core-plugin-api';
import { RedHatBlueOrangeShades } from '../Generic/Constants';

type Props = {};

export default function SpaShip({}: Props) {
  const [loading, setLoading] = useState<boolean>(false);

  const spaship = useApi(devexApiRef);
  const [deploymentCountStats, setDeploymentCountStats] = useState<{
    [key: string]: number;
  }>({
    dev: 0,
    qa: 0,
    stage: 0,
    prod: 0,
    others: 0,
  });

  const [averageDeploymentTimes, setAverageDeploymentTime] = useState<any>();
  const [totalDeploymentCount, setTotalDeploymentCount] = useState(0);
  const [webPropertiesCount, setWebPropertiesCount] = useState(0);
  const [totalEphemeralDeployments, setTotalEphemeralDeployments] = useState(0);
  const [topWebProperties, setTopWebProperties] = useState<any>([]);

  const loadSpaShipData = async () => {
    try {
      const days = [30, 90, 120, 365];
      const responses = await Promise.all(
        days.map(day => spaship.getAverageDeploymentTimeByDays(day)),
      );
      setAverageDeploymentTime(responses);

      const deploymentCount = await spaship.deployedPropertyCount();

      if (deploymentCount && deploymentCount.data) {
        setWebPropertiesCount(deploymentCount.data.length);
        const webProperties = deploymentCount.data;
        webProperties.sort(
          (propertyA: any, propertyB: any) => propertyB.count - propertyA.count,
        );

        setTopWebProperties(webProperties.slice(0, 10));
      }

      const deploymentCountByEnv = await spaship.getDeploymentCountByEnv();

      if (deploymentCountByEnv && deploymentCountByEnv.data) {
        let sumDeploymentCount = 0;
        let countPerEnv: { [key: string]: number } = { dev: 0 };

        deploymentCountByEnv.data.forEach(
          (envData: { count: number; env: string }) => {
            if (['dev', 'qa', 'stage', 'prod'].includes(envData.env)) {
              countPerEnv = {
                ...countPerEnv,
                [envData.env]: envData.count,
              };
            } else {
              countPerEnv = {
                ...countPerEnv,
                others: countPerEnv?.others
                  ? countPerEnv.others + envData.count
                  : envData.count,
              };
            }

            if (envData.env === 'ephemeral')
              setTotalEphemeralDeployments(envData.count);
            sumDeploymentCount += envData.count;
          },
        );
        const sortedEntries = Object.entries(countPerEnv).sort(
          (valueA, valueB) => valueB[1] - valueA[1],
        );
        const sortedObject = Object.fromEntries(sortedEntries);
        setDeploymentCountStats(sortedObject);
        setTotalDeploymentCount(sumDeploymentCount);
      }

      setLoading(false);
    } catch (_err) {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadSpaShipData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      {loading ? (
        <LinearProgress />
      ) : (
        <div>
          <Typography variant="h3" style={{ marginBottom: '1rem' }}>
            SPAship Deployment Stats
          </Typography>
          <div style={{ marginBottom: '1rem' }}>
            <InfoCard>
              <Typography variant="h5">Total Deployments</Typography>
              <Typography variant="h1">{totalDeploymentCount}</Typography>
              <Divider style={{ marginBottom: '0.5rem' }} />
              <Grid container spacing={2}>
                {Object.keys(deploymentCountStats).map(
                  (env: string, index: number) => {
                    return (
                      <Grid item key={`deployment-times-${index}`}>
                        <Typography
                          style={{
                            fontSize: '14px',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                          }}
                        >
                          {env.toUpperCase()}
                        </Typography>
                        <Typography style={{ fontSize: '24px' }}>
                          {deploymentCountStats[env]}
                        </Typography>
                      </Grid>
                    );
                  },
                )}
              </Grid>
            </InfoCard>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            {averageDeploymentTimes && (
              <InfoCard>
                <Typography variant="h5">Avg. Deployment Time</Typography>
                <Typography variant="h1">
                  {averageDeploymentTimes?.[0].data.averageTime || '0'}s{' '}
                  <span style={{ fontSize: '16px', fontWeight: '400' }}>
                    in past 30 days
                  </span>
                </Typography>
                <Divider style={{ marginBottom: '0.5rem' }} />
                <Grid container spacing={2}>
                  {averageDeploymentTimes &&
                    averageDeploymentTimes.map(
                      (
                        data: {
                          data: { days: string; averageTime: number };
                        },
                        index: number,
                      ) => {
                        return (
                          <Grid item key={`avg-deployment-time-${index}`}>
                            <Typography
                              style={{
                                fontSize: '14px',
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                              }}
                            >
                              {data.data.days} days
                            </Typography>
                            <Typography style={{ fontSize: '24px' }}>
                              {data.data.averageTime || '0'}s
                            </Typography>
                          </Grid>
                        );
                      },
                    )}
                </Grid>
              </InfoCard>
            )}
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <InfoCard>
              <Grid container spacing={2} style={{padding:0}}>
                <Grid item>
                  <InfoCard>
                    <Typography variant="h5">Total Properties</Typography>
                    <Typography variant="h3">{webPropertiesCount}</Typography>
                  </InfoCard>
                </Grid>
                <Grid item>
                  <InfoCard>
                    <Typography variant="h5">
                      Total Ephemeral Deployment
                    </Typography>
                    <Typography variant="h3">
                      {totalEphemeralDeployments}
                    </Typography>
                  </InfoCard>
                </Grid>
              </Grid>
            </InfoCard>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <InfoCard>
              <Typography variant="h5">
                Top contributors on deployments
              </Typography>
              <Typography variant="h1">
                {topWebProperties.map(
                  (
                    property: { propertyIdentifier: string; count: number },
                    index: number,
                  ) => (
                    <Tooltip
                      title={property.count}
                      placement="top"
                      key={`spaship-deployment-contributors-tooltip-${index}`}
                    >
                      <Chip
                        avatar={<Avatar>{property.count}</Avatar>}
                        label={property.propertyIdentifier}
                        variant="outlined"
                        style={{
                          color: 'white',
                          backgroundColor: `${
                            RedHatBlueOrangeShades[
                              index % RedHatBlueOrangeShades.length
                            ]
                          }`,
                        }}
                        size="small"
                        key={`spaship-deployment-contributors-chip-${index}`}
                      />
                    </Tooltip>
                  ),
                )}
              </Typography>
            </InfoCard>
          </div>
        </div>
      )}
    </div>
  );
}
