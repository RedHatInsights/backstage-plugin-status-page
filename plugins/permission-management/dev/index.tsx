import { createDevApp } from '@backstage/dev-utils';
import { permissionManagementPlugin, PermissionManagementPage } from '../src/plugin';

createDevApp()
  .registerPlugin(permissionManagementPlugin)
  .addPage({
    element: <PermissionManagementPage />,
    title: 'Root Page',
    path: '/permission-management',
  })
  .render();
