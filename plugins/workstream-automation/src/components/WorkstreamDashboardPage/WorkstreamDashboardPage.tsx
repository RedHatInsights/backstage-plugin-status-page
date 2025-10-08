import { Header, HeaderLabel, Page } from '@backstage/core-components';

import { WorkstreamDashboardContent } from './WorkstreamDashboardContent';

export const WorkstreamDashboardPage = () => {
  return (
    <Page themeId="tool">
      <Header title="Workstream Dashboard" subtitle="Overview of all active workstreams, ARTs, and contributor insights." >
        <HeaderLabel label='Owner' value="Compass" />
        <HeaderLabel label='Lifecycle' value="Alpha" />
      </Header>
      <WorkstreamDashboardContent />
    </Page>
  );
};
