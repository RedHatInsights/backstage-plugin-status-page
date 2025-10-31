import { useSidebarPinState } from '@backstage/core-components';
import GlobalStyles from '@mui/material/GlobalStyles';
import { useLocation } from 'react-router-dom';

/**
 * Fix css of soundcheck pagination
 */
export const SoundcheckPaginationStylesFix = () => {
  const { pathname } = useLocation();
  const { isPinned } = useSidebarPinState();

  // only apply global css on checks page
  if (pathname !== '/soundcheck/checks') return null;

  return (
    <GlobalStyles
      styles={{
        '#rhdh-sidebar-layout > div > div.MuiBox-root > main > div > div > article > div > div > div:nth-last-child(1) > div':
          {
            width: '-moz-available',
            bottom: '1.5rem',
            left: isPinned ? '14rem' : '4.3rem',
            right: '1.5rem',
            marginRight: 0,
          },
      }}
    />
  );
};
