import { Breadcrumbs, Content, Header, HeaderLabel, Page } from '@backstage/core-components';
import { Box, Typography } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import SettingsIcon from '@material-ui/icons/Settings';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AuditApplicationList } from './audit-components/AuditApplicationList';

export const AuditCompliancePage = () => {
  const navigate = useNavigate();
  return (
    <Page themeId="tool">
      <Header
      title=' Audit and Compliance'
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
        <HeaderLabel label="Owner" value="Team X" />
        <HeaderLabel label="Lifecycle" value="Alpha" />
        <Tooltip title="Configuration">
          <IconButton color="primary">
            <SettingsIcon onClick={() => navigate('/audit/configurations')} />
          </IconButton>
        </Tooltip>
      </Header>

      <Content>
       
        <AuditApplicationList />
      </Content>
    </Page>
  );
};
