import {
  Content,
  Header,
  HeaderLabel,
  InfoCard,
  Page
} from '@backstage/core-components';
import { Grid } from '@material-ui/core';
import React from 'react';
import { RegistryComponent } from '../registry';

export const MCPServer = () => (
  <Page themeId="tool">
    <Header title="MCP Server Plugin" subtitle="AppDev X MCP Registry">
      <HeaderLabel label="Owner" value="AppDev" />
      <HeaderLabel label="Lifecycle" value="Alpha" />
    </Header>
    <Content>
      <Grid container spacing={3} direction="column">
        <Grid item>
          <InfoCard title="MCP Server Registry">
            <RegistryComponent />
          </InfoCard>
        </Grid>
      </Grid>
    </Content>
  </Page>
);
