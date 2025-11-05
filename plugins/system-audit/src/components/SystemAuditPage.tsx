import { Page, Header, Content, HeaderLabel } from '@backstage/core-components';
import { SystemAuditDataTable } from './SystemAuditDataTable';

export const SystemAuditPage = () => {
  return (
    <Page themeId="tool">
      <Header
        title="Groups/Accounts Exposed to External Services"
        subtitle="View and manage system groups and accounts exposed to external services"
      >
        <HeaderLabel label="Owner" value="Compliance Team" />
        <HeaderLabel label="Lifecycle" value="Production" />
      </Header>
      <Content>
        <SystemAuditDataTable />
      </Content>
    </Page>
  );
};
