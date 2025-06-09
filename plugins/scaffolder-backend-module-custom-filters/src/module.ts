import { scaffolderTemplatingExtensionPoint } from '@backstage/plugin-scaffolder-node/alpha';
import { createBackendModule } from '@backstage/backend-plugin-api';
import filters from './filters';

export const scaffolderModuleCustomActions = createBackendModule({
  pluginId: 'scaffolder',
  moduleId: 'custom-filters',
  register(reg) {
    reg.registerInit({
      deps: {
        templating: scaffolderTemplatingExtensionPoint,
      },
      async init({ templating }) {
        templating.addTemplateFilters(filters);
      },
    });
  },
});
