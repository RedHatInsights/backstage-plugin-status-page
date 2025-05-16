import { Content, Header, HeaderLabel, Page } from '@backstage/core-components';
import React from 'react';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import SettingsIcon from '@material-ui/icons/Settings';
import { useNavigate } from 'react-router-dom';
import { AuditApplicationList } from './audit-components/AuditApplicationList';

export const AuditCompliancePage = () => {
  const navigate = useNavigate();
  return (
    <Page themeId="tool">
      <Header
        title="Audit and Compliance"
        subtitle="Ensure Trust. Enforce Standards. Empower Teams."
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
