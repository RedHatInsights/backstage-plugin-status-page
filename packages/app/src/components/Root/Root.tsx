import { HydraProxyIcon } from '@appdev/backstage-plugin-proxy-manager';
import { FeedbackIcon } from '@backstage-community/plugin-feedback';
import { ReportPortalIcon } from '@backstage-community/plugin-report-portal';
import {
  Link,
  Sidebar,
  sidebarConfig,
  SidebarDivider,
  SidebarGroup,
  SidebarItem,
  SidebarPage,
  SidebarScrollWrapper,
  SidebarSpace,
  useSidebarOpenState,
  WarningIcon,
} from '@backstage/core-components';
import {
  appThemeApiRef,
  IconComponent,
  useApi,
} from '@backstage/core-plugin-api';
import { Grid, makeStyles } from '@material-ui/core';
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
import { PropsWithChildren } from 'react';
import { NavLink } from 'react-router-dom';
import { CompanyLogo } from '../logo/CompanyLogo';
import './Root.css';

import { CustomSearchBar } from './CustomSearchBar';
import { TopBarActions } from './TopBarActions';

const useSidebarLogoStyles = makeStyles({
  root: {
    width: sidebarConfig.drawerWidthClosed,
    height: 3 * sidebarConfig.logoHeight,
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'center',
    marginBottom: -14,
  },
  link: {
    width: sidebarConfig.drawerWidthClosed,
    marginLeft: 20,
  },
});

const SidebarLogo = () => {
  const classes = useSidebarLogoStyles();
  const { isOpen } = useSidebarOpenState();
  const app = useApi(appThemeApiRef);
  const themeVariant = app.getActiveThemeId();

  if (isOpen) {
    return (
      <div className={classes.root}>
        <Link
          component={NavLink}
          to="/"
          underline="none"
          className={classes.link}
          aria-label="Home"
        >
          <CompanyLogo
            variant={themeVariant === 'light' ? 'logoLight' : 'logoDark'}
          />
        </Link>
      </div>
    );
  }
  return (
    <div className={classes.root}>
      <Link
        component={NavLink}
        to="/"
        underline="none"
        className={classes.link}
        aria-label="Home"
      >
        <CompanyLogo variant="icon" />
      </Link>
    </div>
  );
};

export const Root = ({ children }: PropsWithChildren<{}>) => {
  return (
    <SidebarPage>
      <Sidebar>
        <SidebarLogo />
        {/* <SidebarGroup label="Search" icon={<SearchIcon />} to="/search">
          <Grid container spacing={2}>
            <Grid item xs={8}>
              <SidebarSearchModal />
            </Grid>
            <Grid item xs={4}>
              <DocsBotButton handleDrawerOpen={handleDrawerOpen} />
            </Grid>
          </Grid>
        </SidebarGroup> */}
        <SidebarDivider />
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
            <SidebarItem icon={DoneAllIcon} to="soundcheck" text="Soundcheck" />
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
              text="Compliance"
            />
            <SidebarItem
              icon={MenuBookIcon as IconComponent}
              to="gdpr"
              text="GDPR"
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
      <Grid
        container
        style={{
          display: 'flex',
          minHeight: '3.5rem',
          alignItems: 'center',
          padding: '16px 10px 0px 0px',
        }}
        justifyContent="space-between"
        spacing={0}
      >
        <Grid item sm={4} md={6} lg={8}>
          <CustomSearchBar
            initialState={{
              term: '',
              filters: {},
              types: [],
              pageLimit: 10,
            }}
          />
        </Grid>
        <Grid item>
          <TopBarActions />
        </Grid>
      </Grid>
      {children}
    </SidebarPage>
  );
};
