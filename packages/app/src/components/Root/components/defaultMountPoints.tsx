import {
  Divider,
  HeaderIconButton,
  Spacer,
  StarredDropdown,
} from '@red-hat-developer-hub/backstage-plugin-global-header';
import { SidebarLogo } from './SidebarLogo';
import { ComponentType } from 'react';
import { GlobalHeaderComponentMountPoint } from './types';
import { CustomSearchBar } from './Searchbar';
import { ProfileDropdown } from './ProfileDropdown';
import { AssistantButton } from './AssistantButton';

function createMountPoint<T extends ComponentType<any>>(
  mountPoint: GlobalHeaderComponentMountPoint<T>,
): GlobalHeaderComponentMountPoint<T> {
  return mountPoint;
}

export const globalHeaderComponentsMountPoints: GlobalHeaderComponentMountPoint[] =
  [
    createMountPoint({
      Component: SidebarLogo,
      config: {
        priority: 100,
      },
    }),
    createMountPoint({
      Component: CustomSearchBar,
      config: {
        priority: 98,
      },
    }),
    createMountPoint({
      Component: Spacer,
      config: {
        priority: 95, // the greater the number, the more to the left it will be
        props: {
          growFactor: 0.5,
        },
      },
    }),
    createMountPoint({
      Component: HeaderIconButton,
      config: {
        priority: 90,
        props: {
          icon: 'create',
          to: '/create',
          title: 'Create',
          size: 'medium',
          tooltip: 'Goto Templates',
          color: 'primary',
        },
        layout: {
          color: theme => theme.palette.primary.main,
        }
      },
    }),
    createMountPoint({
      Component: StarredDropdown,
      config: {
        priority: 85,
      },
    }),
    createMountPoint({
      Component: HeaderIconButton,
      config: {
        priority: 20,
        props: {
          to: '/feedback',
          tooltip: 'Check notifications',
          icon: 'notifications',
          size: 'medium',
          title: 'Notification',
          color: 'default',
        },
      },
    }),
    createMountPoint({
      Component: AssistantButton,
      config: {
        priority: 15,
        props: {
          size: 'medium',
          tooltip: 'Open Assistant'
        },
      },
    }),
    createMountPoint({
      Component: Divider,
      config: {
        priority: 10,
      },
    }),
    createMountPoint({
      Component: ProfileDropdown,
      config: {
        priority: 1,
        props: {},
      },
    }),
  ];
