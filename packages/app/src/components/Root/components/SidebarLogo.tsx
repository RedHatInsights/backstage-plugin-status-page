import { Link } from '@backstage/core-components';
import { appThemeApiRef, useApi } from '@backstage/core-plugin-api';
import Box from '@mui/material/Box';
import { NavLink } from 'react-router-dom';
import { CompanyLogo } from '../../logo/CompanyLogo';

export const SidebarLogo = () => {
  const app = useApi(appThemeApiRef);
  const themeVariant = app.getActiveThemeId();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '-8px',
        marginRight: theme => theme.spacing(8),
      }}
    >
      <Link component={NavLink} to="/" underline="none" aria-label="Home">
        <CompanyLogo
          variant={themeVariant === 'light' ? 'logoLight' : 'logoDark'}
        />
      </Link>
    </Box>
  );
};
