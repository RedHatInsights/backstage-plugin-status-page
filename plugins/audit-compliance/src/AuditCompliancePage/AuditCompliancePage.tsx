import {
  Breadcrumbs,
  Content,
  Header,
  HeaderLabel,
  Page,
} from '@backstage/core-components';
import { Box, Typography } from '@material-ui/core';
import React from 'react';
import { AuditApplicationList } from './audit-components/AuditApplicationList';
import Group from '@material-ui/icons/Group';

export const AuditCompliancePage = () => {
  return (
    <Page themeId="tool">
      <Header
        title=" Audit and Compliance"
        subtitle={
          <Box>
            <Typography variant="subtitle1" style={{ marginBottom: '8px' }}>
              Ensure Trust. Enforce Standards. Empower Teams.
            </Typography>
            <Breadcrumbs aria-label="breadcrumb">
              <Typography color="textPrimary">Audit and Compliance</Typography>
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
      </Header>

      <Content>
        <AuditApplicationList />
      </Content>
    </Page>
  );
};
