import React from 'react';
import { Content, Header, HeaderLabel, Page } from '@backstage/core-components';
import { StatsCard } from '../Generic/StatsCard';
import SpaShip from './SpaShip';
import { Grid } from '@material-ui/core';

export const AppDevDashboard = () => {
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

  return (
    <Page themeId="tool">
      <Header title="AppDev Dashboard" subtitle="AppDev Analytics Dashboard">
        <HeaderLabel label="Owner" value="Team DevEx" />
      </Header>
      <Content>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <SpaShip />
          </Grid>
          <Grid item xs={6}>
            <>
              {AppDevDataStreams.map(dataStream => {
                return <StatsCard width="100%" dataStream={dataStream} />;
              })}
            </>
          </Grid>
        </Grid>
      </Content>
    </Page>
  );
};
