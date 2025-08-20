import {
  Breadcrumbs,
  Content,
  Header,
  HeaderLabel,
  Page,
} from '@backstage/core-components';
import { Box, Typography, Link } from '@material-ui/core';
import { AuditApplicationList } from './audit-components/AuditApplicationList';
import Group from '@material-ui/icons/Group';
import DescriptionIcon from '@material-ui/icons/Description';

export const AuditCompliancePage = () => {
  return (
    <Page themeId="tool">
      <Header
        title=" Audit Access Manager"
        subtitle={
          <Box>
            <Typography variant="subtitle1" style={{ marginBottom: '8px' }}>
              Ensure Trust. Enforce Standards. Empower Teams.
            </Typography>
            <Breadcrumbs aria-label="breadcrumb">
              <Typography color="textPrimary">Audit Access Manager</Typography>
            </Breadcrumbs>
          </Box>
        }
      >
        <HeaderLabel
          label="Owner"
          value={
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Group fontSize="small" /> Appdev
            </span>
          }
        />
        <HeaderLabel label="Lifecycle" value="Alpha" />
        <HeaderLabel
          label="Documentation"
          value={
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Link
                href="https://console.one.redhat.com/docs/compass/component/audit-compliance-plugin/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  color: 'inherit',
                  textDecoration: 'none',
                }}
              >
                <DescriptionIcon fontSize="small" />
                Docs
              </Link>
            </span>
          }
        />
      </Header>

      <Content>
        <AuditApplicationList />
      </Content>
    </Page>
  );
};
