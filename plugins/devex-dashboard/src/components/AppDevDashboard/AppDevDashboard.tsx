import { Content, Header, HeaderLabel, Page } from '@backstage/core-components';
import SpaShip from './SpaShip';
import { Grid } from '@material-ui/core';
import Docsbot from './Docsbot';

export const AppDevDashboard = () => {
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
            <Docsbot />
          </Grid>
        </Grid>
      </Content>
    </Page>
  );
};
