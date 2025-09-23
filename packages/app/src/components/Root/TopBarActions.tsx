import { DocsBotIcon, DocsBotPanel } from '@appdev/backstage-plugin-docsbot';
import { Avatar, UserIcon, UserIdentity } from '@backstage/core-components';
import {
  configApiRef,
  identityApiRef,
  useApi,
  useRouteRef,
} from '@backstage/core-plugin-api';
import {
  Button,
  ButtonGroup,
  ClickAwayListener,
  Divider,
  Grow,
  makeStyles,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  Typography,
  useMediaQuery,
  useTheme,
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import NotificationsIcon from '@material-ui/icons/Notifications';
import SettingsIcon from '@material-ui/icons/Settings';
import MeetingRoomIcon from '@material-ui/icons/MeetingRoom';
import CreateComponentIcon from '@material-ui/icons/AddCircleOutline';

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import useAsync from 'react-use/esm/useAsync';
import { parseEntityRef } from '@backstage/catalog-model';
import { entityRouteRef } from '@backstage/plugin-catalog-react';
import { scaffolderPlugin } from '@backstage/plugin-scaffolder';
import { feedbackPlugin } from '@backstage-community/plugin-feedback';
import { userSettingsPlugin } from '@backstage/plugin-user-settings';

const useStyles = makeStyles(theme => ({
  avatar: {
    width: theme.spacing(4),
    height: theme.spacing(4),
  },
  menuItem: {
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
  },
}));

export const TopBarActions = () => {
  const classes = useStyles();
  const config = useApi(configApiRef);
  const identityApi = useApi(identityApiRef);

  const mockIdentityApi = UserIdentity.fromLegacy({
    profile: config.getOptional('auth.providers.guest.profile') ?? {},
    userId: 'yoswal',
  });

  const { value } = useAsync(async () => {
    return {
      profileInfo: await mockIdentityApi.getProfileInfo(), // Sould not be used outside dev env.
      backstageIdentity: await identityApi.getBackstageIdentity(),
    };
  }, []);

  const [isDocsBotPanelOpen, setIsDocsBotPanelOpen] = useState(false);

  useEffect(() => {
    if (isDocsBotPanelOpen) {
      // this class is defined in Root.css
      document.body.classList.add('docsbot-open');
    } else {
      document.body.classList.remove('docsbot-open');
    }
  }, [isDocsBotPanelOpen]);

  const toggleDrawer = (): void => {
    setIsDocsBotPanelOpen(!isDocsBotPanelOpen);
  };
  const navigate = useNavigate();

  const anchorRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const handleToggle = () => {
    setOpen(prevOpen => !prevOpen);
  };
  const handleClose = (event: React.MouseEvent<EventTarget>) => {
    if (
      anchorRef.current &&
      anchorRef.current.contains(event.target as HTMLElement)
    ) {
      return;
    }
    setOpen(false);
  };

  const catalogRoute = useRouteRef(entityRouteRef);
  const scaffolderPage = useRouteRef(scaffolderPlugin.routes.root);
  const feedbackPage = useRouteRef(feedbackPlugin.routes.root);
  const settingsPage = useRouteRef(userSettingsPlugin.routes.settingsPage);

  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));

  return (
    value?.profileInfo && (
      <>
        <ButtonGroup variant="outlined">
          <Button
            style={{ padding: '10px 15px' }}
            variant="text"
            onClick={() => navigate(scaffolderPage())}
          >
            <CreateComponentIcon />
          </Button>
          <Button
            style={{ padding: '10px 15px' }}
            variant="text"
            onClick={() => navigate(feedbackPage())}
          >
            <NotificationsIcon />
          </Button>
          <Button
            style={{ padding: '10px 15px' }}
            variant="text"
            onClick={toggleDrawer}
          >
            <DocsBotIcon />
          </Button>
          <Button
            style={{ padding: '8px 15px' }}
            variant="text"
            ref={anchorRef}
            onClick={handleToggle}
          >
            <Avatar
              displayName={value.profileInfo.displayName}
              picture={value.profileInfo.picture}
              classes={{ avatar: classes.avatar }}
            />
            &nbsp;&nbsp;
            {isMdUp && (
              <Typography variant="body1">
                {value.profileInfo.displayName}
              </Typography>
            )}
            &nbsp;
            <ExpandMoreIcon />
          </Button>
        </ButtonGroup>
        <Popper
          open={open}
          anchorEl={anchorRef.current}
          role="dialog"
          transition
          disablePortal
          style={{ zIndex: theme.zIndex.drawer + 1, width: '150px' }}
          placement="bottom-end"
        >
          {({ TransitionProps, placement }) => (
            <Grow
              {...TransitionProps}
              style={{
                transformOrigin:
                  placement === 'bottom' ? 'center top' : 'center bottom',
              }}
            >
              <Paper>
                <ClickAwayListener onClickAway={handleClose}>
                  <MenuList
                    autoFocusItem={open}
                    id="menu-list-grow"
                    disablePadding
                  >
                    <MenuItem
                      className={classes.menuItem}
                      onClick={e => {
                        navigate(
                          catalogRoute(
                            parseEntityRef(
                              value.backstageIdentity.userEntityRef,
                            ),
                          ),
                        );
                        handleClose(e);
                      }}
                    >
                      <UserIcon />
                      &nbsp; Profile
                    </MenuItem>
                    <MenuItem
                      onClick={e => {
                        navigate(settingsPage());
                        handleClose(e);
                      }}
                      className={classes.menuItem}
                    >
                      <SettingsIcon />
                      &nbsp; Settings
                    </MenuItem>
                    <Divider />
                    <MenuItem
                      onClick={async () => {
                        await identityApi.signOut();
                      }}
                      className={classes.menuItem}
                    >
                      <MeetingRoomIcon />
                      &nbsp; Sign Out
                    </MenuItem>
                  </MenuList>
                </ClickAwayListener>
              </Paper>
            </Grow>
          )}
        </Popper>
        <DocsBotPanel isOpen={isDocsBotPanelOpen} toggleDrawer={toggleDrawer} />
      </>
    )
  );
};
