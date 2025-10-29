import { HydraProxyIcon } from '@appdev/backstage-plugin-proxy-manager';
import { FeedbackIcon } from '@backstage-community/plugin-feedback';
import { ReportPortalIcon } from '@backstage-community/plugin-report-portal';
import {
  Sidebar,
  SidebarDivider,
  SidebarGroup,
  SidebarItem,
  SidebarPage,
  SidebarScrollWrapper,
  SidebarSpace,
  WarningIcon,
} from '@backstage/core-components';
import { IconComponent } from '@backstage/core-plugin-api';
import { Box } from '@material-ui/core';
import CreateComponentIcon from '@material-ui/icons/AddCircleOutline';
import BuildIcon from '@material-ui/icons/Build';
import DataUsageIcon from '@material-ui/icons/DataUsage';
import DoneAllIcon from '@material-ui/icons/DoneAll';
import ExtensionIcon from '@material-ui/icons/Extension';
import SpashipIcon from '@material-ui/icons/FlightTakeoff';
import HomeIcon from '@material-ui/icons/Home';
import LibraryBooks from '@material-ui/icons/LibraryBooks';
import MenuIcon from '@material-ui/icons/Menu';
import MenuBookIcon from '@material-ui/icons/MenuBook';
import MapIcon from '@material-ui/icons/MyLocation';
import Report from '@material-ui/icons/Report';
import SecurityIcon from '@material-ui/icons/Security';
import { styled } from '@mui/material/styles';
import { GlobalHeaderComponent } from '@red-hat-developer-hub/backstage-plugin-global-header';
import { PropsWithChildren } from 'react';
import './Root.css';
import { SidebarLayout } from './components/SidebarLayout';
import { globalHeaderComponentsMountPoints as globalHeaderComponentMountPoints } from './components/defaultMountPoints';

/** This component is copy pasted from RHDH and should be kept in sync. */
const PageWithoutFixHeight = styled(Box, {
  name: 'RHDHPageWithoutFixHeight',
  slot: 'root',
})(() => ({
  // Use the complete viewport (similar to how Backstage does it) and make the
  // page content part scrollable below. We also need to compensate for the
  // above-sidebar position of the global header as it takes up a fixed height
  // at the top of the page.
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',

  // This solves the same issue for techdocs, which was reported as
  // https://issues.redhat.com/browse/RHIDP-4637
  '.techdocs-reader-page > main': {
    height: 'unset',
  },
}));

export const Root = ({ children }: PropsWithChildren<{}>) => {
  return (
    <PageWithoutFixHeight>
      <div id="rhdh-above-sidebar-header-container">
        <GlobalHeaderComponent
          globalHeaderMountPoints={globalHeaderComponentMountPoints}
        />
      </div>
      <SidebarLayout
        id="rhdh-sidebar-layout"
        aboveMainContentHeaderHeight={0}
        aboveSidebarHeaderHeight={64}
      >
        <SidebarPage>
          <div id="rhdh-above-main-content-header-container" />
          <Sidebar>
            <SidebarGroup label="Menu" icon={<MenuIcon />}>
              {/* Global nav, not org-specific */}
              <SidebarItem icon={HomeIcon} to="catalog" text="Home" />
              <SidebarItem icon={ExtensionIcon} to="api-docs" text="APIs" />
              <SidebarItem icon={LibraryBooks} to="docs" text="Docs" />
              <SidebarItem
                icon={CreateComponentIcon}
                to="create"
                text="Create..."
              />
              {/* End global nav */}
              <SidebarDivider />
              <SidebarScrollWrapper>
                <SidebarItem
                  icon={ReportPortalIcon as IconComponent}
                  to="audit-access-manager"
                  text="Audit Access Manager"
                />
                <SidebarItem
                  icon={DoneAllIcon as IconComponent}
                  to="audit-access-manager/compliance-manager"
                  text="Compliance Manager"
                />
                <SidebarItem icon={MapIcon} to="tech-radar" text="Tech Radar" />
                <SidebarItem
                  icon={ReportPortalIcon as IconComponent}
                  to="report-portal"
                  text="Report Portal"
                />
                <SidebarItem icon={SpashipIcon} to="spaship" text="SPAship" />
                <SidebarItem
                  icon={HydraProxyIcon}
                  to="proxy-manager"
                  text="Hydra Proxy"
                />
                <SidebarItem
                  icon={FeedbackIcon as IconComponent}
                  to="feedback"
                  text="Feedback"
                />
                <SidebarItem
                  icon={DoneAllIcon}
                  to="soundcheck"
                  text="Soundcheck"
                />
                <SidebarItem
                  icon={DataUsageIcon as IconComponent}
                  to="dashboard/compass"
                  text="Compass Dashboard"
                />
                <SidebarItem
                  icon={DataUsageIcon as IconComponent}
                  to="dashboard/app-dev"
                  text="AppDev Dashboard"
                />
                <SidebarItem
                  icon={DataUsageIcon as IconComponent}
                  to="dashboard/hydra"
                  text="Hydra Dashboard"
                />
                <SidebarItem
                  icon={DataUsageIcon as IconComponent}
                  to="dashboard/data-layer"
                  text="Data Layer Dashboard"
                />
                <SidebarItem
                  icon={Report as IconComponent}
                  to="status-page"
                  text="Status Page"
                />
                <SidebarItem
                  icon={Report as IconComponent}
                  to="hydra-permission-management"
                  text="Permission Management"
                />
                <SidebarItem
                  icon={SecurityIcon as IconComponent}
                  to="compliance"
                  text="Compliance Hub"
                />
                <SidebarItem
                  icon={MenuBookIcon as IconComponent}
                  to="compliance/gdpr"
                  text="GDPR"
                />
                <SidebarItem
                  icon={DataUsageIcon as IconComponent}
                  to="workstream/dashboard"
                  text="Workstream Dashboard"
                />
                <SidebarItem
                  icon={BuildIcon}
                  to="entity-validator"
                  text="Entity Validator"
                />

                <SidebarItem
                  icon={DataUsageIcon as IconComponent}
                  to="dora-metrics"
                  text="Dora Metrics"
                />
              </SidebarScrollWrapper>
            </SidebarGroup>
            <SidebarSpace />
            <SidebarDivider />
            <SidebarItem
              to="catalog-unprocessed-entities"
              icon={WarningIcon}
              text="Unprocessed Entites"
            />
            <SidebarItem icon={BuildIcon} to="devtools" text="DevTools" />
          </Sidebar>
          {children}
        </SidebarPage>
      </SidebarLayout>
    </PageWithoutFixHeight>
  );
};
