import Box from '@mui/material/Box';
import { styled, Theme } from '@mui/material/styles';
import { ThemeConfig } from '@red-hat-developer-hub/backstage-plugin-theme';

/** This component is copy pasted from RHDH and should be kept in sync. */
export const SidebarLayout = styled(Box, {
  name: 'RHDHPageWithoutFixHeight',
  slot: 'sidebarLayout',
  shouldForwardProp: prop =>
    prop !== 'aboveSidebarHeaderHeight' &&
    prop !== 'aboveMainContentHeaderHeight',
})<{
  theme?: Theme & ThemeConfig;
  aboveSidebarHeaderHeight?: number;
  aboveMainContentHeaderHeight?: number;
}>(({ theme, aboveSidebarHeaderHeight, aboveMainContentHeaderHeight }) => ({
  // We remove Backstage's 100vh on the content, and instead rely on flexbox
  // to take up the whole viewport.
  display: 'flex',
  flexGrow: 1,
  maxHeight: `calc(100vh - ${aboveSidebarHeaderHeight ?? 0}px)`,

  '& div[class*="BackstageSidebarPage"]': {
    display: 'flex',
    flexDirection: 'column',
    height: 'unset',
    flexGrow: 1,
    // Here we override the theme so that the Backstage default page suspense
    // takes up the whole height of the page instead of 100vh. The difference
    // lies in the height of the global header above the sidebar.
    '@media (min-width: 600px)': {
      '& > [class*="MuiLinearProgress-root"]': {
        height: 'unset',
        flexGrow: 1,
      },
    },

    // Fix for soundcheck page as main element is nested under div
    '& > div.MuiBox-root > main': {
      
      // clip-path clips the scrollbar properly in Chrome compared to
      // border-radius. 1rem is the hardcoded border-radius of the page content.
      clipPath: 'rect(0 100% 100% 0 round 1rem)',

      // Emulate the PatternFly 6 page inset using a margin
      margin: theme.palette.rhdh?.general.pageInset,
      marginLeft: '0 !important',
      marginTop: '0 !important',

      // Prevent overflow in the main container due to the margin
      maxHeight: `calc(100vh - 3.65 * ${theme.palette.rhdh?.general.pageInset})`,
    },
  },

  // The height is controlled by the flexbox in the BackstageSidebarPage.
  '& > div.MuiBox-root > main': {
    height: `calc(100vh - ${
      aboveSidebarHeaderHeight! + aboveMainContentHeaderHeight!
    }px)`,
    flexGrow: 1,
  },

  // We need to compensate for the above-sidebar position of the global header
  // as it takes up a fixed height at the top of the page.
  '& div[class*="BackstageSidebar-drawer"]': {
    top: `max(0px, ${aboveSidebarHeaderHeight ?? 0}px)`,
  },
}));
