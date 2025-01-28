import React, { useEffect, useState } from 'react';
import { Content, Header, HeaderLabel, Page } from '@backstage/core-components';
import { StatsCard } from '../Generic/StatsCard';
import { spashipApiRef } from '../../api';
import { useApi } from '@backstage/core-plugin-api';
import { DataStream } from '../../Interfaces';

export const AppDevDashboard = () => {
  const spaship = useApi(spashipApiRef);
  const streams = ['spaship', 'docsbot'];

  const AppDevDataStreams = [
    {
      workStream: 'Docsbot',
      sourceUrl: '/docsbot',
      dataPoints: [
        {
          name: 'Total Queries',
          value: 234,
        },
        {
          name: 'Thumps Up',
          value: 53,
        },
        {
          name: 'Thumps Down',
          value: 3,
        },
      ],
    },
  ];
  const [appDevDataStreams, setAppDevDataStreams] =
    useState<DataStream[]>(AppDevDataStreams);
  const [loading, setLoading] = useState<boolean>(false);

  const loadSpaShipData = async () => {
    const deploymentHistory = await spaship.getDeploymentCount();

    if (deploymentHistory) {
      const totalWebProperties = deploymentHistory.data.length;
      const totalDeploymentCount = deploymentHistory.data.reduce(
        (count: number, data: any) => {
          return  count + data.count;
        },
        0,
      );

      setAppDevDataStreams([
        {
          workStream: 'SPAship',
          sourceUrl: 'https://spaship.redhat.com/',
          dataPoints: [
            {
              name: 'Deployments',
              value: totalDeploymentCount,
            },
            {
              name: 'Web Properties',
              value: totalWebProperties,
            },
          ],
        },
        ...appDevDataStreams,
      ]);
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadSpaShipData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Page themeId="tool">
      <Header title="AppDev Dashboard" subtitle="AppDev Analytics Dashboard">
        <HeaderLabel label="Owner" value="Team DevEx" />
      </Header>
      <Content>
        {loading ? (
          streams
            .map(() => (
              <StatsCard
                width="50%"
                dataStream={null}
                loadingInProgress={loading}
              />
            ))
        ) : (
          <>
            {appDevDataStreams &&
              appDevDataStreams.map(dataStream => {
                return <StatsCard width="50%" dataStream={dataStream}/>;
              })}
          </>
        )}
      </Content>
    </Page>
  );
};
