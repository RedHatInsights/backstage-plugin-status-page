/* eslint-disable no-restricted-imports */
import { parseEntityRef } from '@backstage/catalog-model';
import { Link, UserIdentity } from '@backstage/core-components';
import {
  configApiRef,
  identityApiRef,
  useApi,
  useRouteRef,
} from '@backstage/core-plugin-api';
import { entityRouteRef } from '@backstage/plugin-catalog-react';
import {
  userSettingsPlugin
} from '@backstage/plugin-user-settings';
import SettingsIcon from '@material-ui/icons/Settings';
import { ExpandMoreOutlined } from '@mui/icons-material';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import {
  Avatar,
  Box,
  Button,
  ButtonPropsColorOverrides,
  Divider,
  LinearProgress,
  Menu,
  MenuItem,
  styled,
  Typography
} from '@mui/material';
import { OverridableStringUnion } from '@mui/types';
import { CSSProperties, useState } from 'react';
import { useAsync } from 'react-use';

type ProfileDropdownProps = {
  layout?: CSSProperties;
  color?: OverridableStringUnion<
    | 'inherit'
    | 'primary'
    | 'secondary'
    | 'success'
    | 'error'
    | 'info'
    | 'warning',
    ButtonPropsColorOverrides
  >;
};

const StyledMenuItem = styled(MenuItem, { name: 'StyledMenuItem' })({
  marginBlock: '4px',
});

export const ProfileDropdown = ({
  layout,
  color = 'inherit',
}: ProfileDropdownProps) => {
  const config = useApi(configApiRef);
  const identityApi = useApi(identityApiRef);

  const mockIdentityApi = UserIdentity.fromLegacy({
    profile: config.getOptional('auth.providers.guest.profile') ?? {},
    userId: 'yoswal',
  });

  const { value: user, loading } = useAsync(async () => {
    return {
      profileInfo: await mockIdentityApi.getProfileInfo(), // Sould not be used outside dev env.
      backstageIdentity: await identityApi.getBackstageIdentity(),
    };
  }, []);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const catalogRoute = useRouteRef(entityRouteRef);
  const settingsPage = useRouteRef(userSettingsPlugin.routes.settingsPage);

  return !loading && user ? (
    <Box sx={{ display: 'flex', alignItems: 'center', ...layout }}>
      <Button
        sx={{ py: '8px', px: '15px' }}
        size="small"
        variant="text"
        color={color}
        aria-controls={open ? 'demo-positioned-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
      >
        <Avatar
          src={user.profileInfo.picture}
          sx={theme => ({
            mr: 2,
            width: theme.spacing(4),
            height: theme.spacing(4),
          })}
        />
        <Typography
          sx={theme => ({
            display: theme.breakpoints.up('md') ? 'block' : 'none',
          })}
          variant="body1"
        >
          {user.profileInfo.displayName}
        </Typography>
        &nbsp;
        <ExpandMoreOutlined />
      </Button>
      <Menu
        id="profile-dropdown-menu"
        aria-labelledby="demo-positioned-button"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        sx={{
          padding: 0,
        }}
        slotProps={{
          paper: {
            sx: { width: '150px', '& > ul': { padding: 0 } },
          },
        }}
      >
        <Link
          color="inherit"
          to={catalogRoute(
            parseEntityRef(user?.backstageIdentity.userEntityRef),
          )}
        >
          <StyledMenuItem
            onClick={() => {
              handleClose();
            }}
          >
            <AccountCircleOutlinedIcon />
            &nbsp; Profile
          </StyledMenuItem>
        </Link>
        <Link color="inherit" to={settingsPage()}>
          <StyledMenuItem
            onClick={() => {
              handleClose();
            }}
          >
            <SettingsIcon />
            &nbsp; Settings
          </StyledMenuItem>
        </Link>
        <Divider />
        <StyledMenuItem
          onClick={async () => {
            await identityApi.signOut();
          }}
        >
          <LogoutOutlinedIcon />
          &nbsp; Sign Out
        </StyledMenuItem>
      </Menu>
    </Box>
  ) : (
    <LinearProgress />
  );
};
