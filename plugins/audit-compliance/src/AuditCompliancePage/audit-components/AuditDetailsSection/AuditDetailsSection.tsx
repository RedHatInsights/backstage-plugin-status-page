import React, { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Page,
  Header,
  Content,
  GroupIcon,
  HeaderLabel,
} from '@backstage/core-components';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  makeStyles,
} from '@material-ui/core';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import AssessmentIcon from '@material-ui/icons/Assessment';
import RoverAuditTable from './AuditTable/RoverAuditTable';
import ServiceAccountAccessReviewTable from './AuditTable/ServiceAccountAccessReviewTable';

const useStyles = makeStyles(theme => ({
  tabsRoot: {
    marginTop: theme.spacing(3),
  },
  tabPanel: {
    marginTop: theme.spacing(2),
  },
}));

export const AuditDetailsSection = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { app_name } = useParams<{ app_name: string }>();

  const frequency = state?.frequency;
  const period = state?.period;
  const [tabIndex, setTabIndex] = useState(0);
  const handleBack = () => navigate(-1);

  const handleSummary = () =>
    navigate(`/audit-compliance/${app_name}/${frequency}/${period}/summary`);

  const handleTabChange = (_event: React.ChangeEvent<{}>, newIndex: number) => {
    setTabIndex(newIndex);
  };

  return (
    <Page themeId="tool">
      <Header
        title="Audit and Compliance"
        subtitle="Ensure Trust. Enforce Standards. Empower Teams."
      >
        <HeaderLabel
          label="Owner"
          value={
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <GroupIcon fontSize="small" /> Appdev
            </span>
          }
        />
        <HeaderLabel label="Lifecycle" value="Alpha" />
        <Tooltip title="Configuration">
          <IconButton color="primary">
            {/* Placeholder for future settings */}
          </IconButton>
        </Tooltip>
      </Header>
      <Content>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h4">
            {`${app_name} Quarterly Audit – ${period.toUpperCase()} Review`}
          </Typography>
          <Box>
            <Tooltip title="Back to Audit List">
              <IconButton onClick={handleBack}>
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="View Final Summary">
              <IconButton onClick={handleSummary}>
                <AssessmentIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Tabs
          value={tabIndex}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          className={classes.tabsRoot}
        >
          <Tab label="User Access Review" />
          <Tab label="Service Account Review" />
        </Tabs>

        {tabIndex === 1 && (
          <Box className={classes.tabPanel}>
            <ServiceAccountAccessReviewTable
              app_name={app_name}
              frequency={frequency}
              period={period}
            />
          </Box>
        )}
        {tabIndex === 0 && (
          <Box className={classes.tabPanel}>
            <RoverAuditTable
              app_name={app_name}
              frequency={frequency}
              period={period}
            />
          </Box>
        )}
      </Content>
    </Page>
  );
};
