import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { catalogServiceRef } from '@backstage/plugin-catalog-node';
import { scaffolderActionsExtensionPoint } from '@backstage/plugin-scaffolder-node';
import { DatasourceApiClient } from '@compass/backstage-plugin-datasource-common';
import { createDatasource, validateData } from './actions';

export const datasourceScaffolderModule = createBackendModule({
  pluginId: 'scaffolder',
  moduleId: 'datasource-actions',
  register: ({ registerInit }) =>
    registerInit({
      deps: {
        scaffolderActions: scaffolderActionsExtensionPoint,
        catalog: catalogServiceRef,
        discovery: coreServices.discovery,
        auth: coreServices.auth,
      },
      init: async ({ scaffolderActions, auth, catalog, discovery }) => {
        const dataClient = new DatasourceApiClient({
          discoveryApi: discovery,
        });
        scaffolderActions.addActions(
          validateData({ auth, catalog, dataClient }),
          createDatasource({ auth, dataClient }),
        );
      },
    }),
});
