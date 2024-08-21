import React, { PropsWithChildren, useState } from 'react';
import { Chip, Grid, makeStyles } from '@material-ui/core';
import HomeIcon from '@material-ui/icons/Home';
import ExtensionIcon from '@material-ui/icons/Extension';
import MapIcon from '@material-ui/icons/MyLocation';
import SpashipIcon from '@material-ui/icons/FlightTakeoff';
import LibraryBooks from '@material-ui/icons/LibraryBooks';
import CreateComponentIcon from '@material-ui/icons/AddCircleOutline';
import LogoFull from './LogoFull';
import LogoIcon from './LogoIcon';
import {
  Settings as SidebarSettings,
  UserSettingsSignInAvatar,
} from '@backstage/plugin-user-settings';
import { SidebarSearchModal } from '@backstage/plugin-search';
import {
  Sidebar,
  sidebarConfig,
  SidebarDivider,
  SidebarGroup,
  SidebarItem,
  SidebarPage,
  SidebarScrollWrapper,
  SidebarSpace,
  useSidebarOpenState,
  Link,
} from '@backstage/core-components';
import MenuIcon from '@material-ui/icons/Menu';
import SearchIcon from '@material-ui/icons/Search';
import { HydraProxyIcon } from '@appdev-platform/backstage-plugin-proxy-manager';
import { ReportPortalIcon } from '@appdev-platform/backstage-plugin-report-portal';
import { IconComponent } from '@backstage/core-plugin-api';
import { FeedbackIcon } from '@janus-idp/backstage-plugin-feedback';
import {
  DocsBotPanel,
  DocsBotButton,
  DocsBotIcon,
} from '@appdev-platform/backstage-plugin-docsbot';

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
    marginLeft: 24,
  },
});

const SidebarLogo = () => {
  const classes = useSidebarLogoStyles();
  const { isOpen } = useSidebarOpenState();

  return (
    <div className={classes.root}>
      <Link to="/" underline="none" className={classes.link} aria-label="Home">
        {isOpen ? <LogoFull /> : <LogoIcon />}
      </Link>
    </div>
  );
};

export const Root = ({ children }: PropsWithChildren<{}>) => {
  const [isDocsBotPanelOpen, setIsDocsBotPanelOpen] = useState<boolean>(false);

  const handleDrawerOpen = (flag: boolean) => {
    setIsDocsBotPanelOpen(flag);
  };

  const toggleDrawer = (): void => {
    setIsDocsBotPanelOpen(!isDocsBotPanelOpen);
  };
  return (
    <SidebarPage>
      <Sidebar>
        <SidebarLogo />
        <SidebarGroup label="Search" icon={<SearchIcon />} to="/search">
          <Grid container spacing={2}>
            <Grid item xs={8}>
              <SidebarSearchModal />
            </Grid>
            <Grid item xs={4}>
              <DocsBotButton handleDrawerOpen={handleDrawerOpen} />
            </Grid>
          </Grid>
        </SidebarGroup>
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
            <SidebarItem icon={MapIcon} to="tech-radar" text="Tech Radar" />
            <SidebarItem
              icon={ReportPortalIcon as IconComponent}
              to="report-portal"
              text="Report Portal"
            />
          </SidebarScrollWrapper>
          <SidebarScrollWrapper>
            <SidebarItem icon={SpashipIcon} to="spaship" text="SPAship" />
          </SidebarScrollWrapper>
          <SidebarScrollWrapper>
            <SidebarItem
              icon={HydraProxyIcon}
              to="proxy-manager"
              text="Hydra Proxy"
            />
          </SidebarScrollWrapper>
          <SidebarScrollWrapper>
            <SidebarItem
              icon={FeedbackIcon as IconComponent}
              to="feedback"
              text="Feedback"
            />
          </SidebarScrollWrapper>
          <Grid container>
            <Grid item xs={8}>
              <SidebarItem
                icon={DocsBotIcon as IconComponent}
                to="docsbot"
                text="DocsBot"
              />
            </Grid>
            <Grid item xs={4}>
              <Chip
                style={{
                  margin: '12px 0px 0px 0px',
                  color: '#b5b5b5',
                  borderColor: '#b5b5b5',
                }}
                label="Beta"
                size="small"
                variant="outlined"
              />
            </Grid>
          </Grid>
        </SidebarGroup>
        <SidebarSpace />
        <SidebarDivider />
        <SidebarGroup
          label="Settings"
          icon={<UserSettingsSignInAvatar />}
          to="/settings"
        >
          <SidebarSettings />
        </SidebarGroup>
      </Sidebar>
      <div
        style={{ width: isDocsBotPanelOpen ? `calc(100% - 400px)` : '100%' }}
      >
        {children}
      </div>
      <DocsBotPanel isOpen={false} toggleDrawer={toggleDrawer} />
    </SidebarPage>
  );
};
