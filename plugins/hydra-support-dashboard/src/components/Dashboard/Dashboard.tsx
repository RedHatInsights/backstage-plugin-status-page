import { Content, Header, HeaderLabel, Page } from '@backstage/core-components';
import { Box, Tab } from '@material-ui/core';
import { TabContext, TabList, TabPanel } from '@material-ui/lab';
import React from 'react';
import { SupportDashboard } from './SupportDashboard/SupportDashboard';
import { AnalyticalDashboard } from './AnalyticalDashboard/AnalyticalDashboard';

type Props = {};

export const Dashboard = ({}: Props) => {
  const [value, setValue] = React.useState('1');

  const handleChange = (_event: any, newValue: string) => {
    setValue(newValue);
  };

  return (
    <Page themeId="tool">
      <Header
        title="Hydra Dashboard"
        subtitle="Analytics based on Splunk Logs & JIRA"
      >
        <HeaderLabel label="Owner" value="DevEx" />
      </Header>
      <Content>
        <Box sx={{ width: '100%' }}>
          <TabContext value={value}>
            <Box sx={{ borderBottom: 1 }}>
              <TabList
                onChange={handleChange}
                aria-label="Hydra Dashboard Tabs"
              >
                <Tab label="Analytical Dashboard" value="1" />
                {/* <Tab label="Support Dashboard" value="2" /> */}
              </TabList>
            </Box>
            <TabPanel value="1">
              <AnalyticalDashboard />
            </TabPanel>
            <TabPanel value="2">
              <SupportDashboard />
            </TabPanel>
          </TabContext>
        </Box>
      </Content>
    </Page>
  );
};
