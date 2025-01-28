import React from 'react';
import { Content, Header, HeaderLabel, Page } from '@backstage/core-components';
import { StatsCard } from '../Generic/StatsCard';

export const DataLayerDashboard = () => {
  const PulseDataStreams = [
    {
      workStream: 'Subgraph',
      dataPoints: [
        {
          name: 'Subgraphs developed',
          value: 74356,
        },
      ],
    },
  ];

  return (
    <Page themeId="tool">
      <Header
        title="Data layer Dashboard"
        subtitle="Data layer Analytics Dashboard"
      >
        <HeaderLabel label="Owner" value="Team DevEx" />
      </Header>
      <Content>
        {PulseDataStreams.map(dataStream => {
          return <StatsCard width="50%" dataStream={dataStream} />;
        })}
      </Content>
    </Page>
  );
};
