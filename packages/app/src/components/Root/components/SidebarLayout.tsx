import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';

/** This component is copy pasted from RHDH and should be kept in sync. */
export const SidebarLayout = styled(Box, {
  name: 'RHDHPageWithoutFixHeight',
  slot: 'sidebarLayout',
  shouldForwardProp: prop =>
    prop !== 'aboveSidebarHeaderHeight' &&
    prop !== 'aboveMainContentHeaderHeight',
})(
  ({
    aboveSidebarHeaderHeight,
    aboveMainContentHeaderHeight,
  }: {
    aboveSidebarHeaderHeight?: number;
    aboveMainContentHeaderHeight?: number;
  }) => ({
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
  }),
);
