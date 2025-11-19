import { createBackendModule } from '@backstage/backend-plugin-api';
import { catalogLocationsExtensionPoint } from '@backstage/plugin-catalog-node/alpha';

const allowedCatalogLocationTypesModule = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'allowed-catalog-location-types',
  register: reg =>
    reg.registerInit({
      deps: {
        locationProcessor: catalogLocationsExtensionPoint,
      },
      init: async ({ locationProcessor }) => {
        locationProcessor.setAllowedLocationTypes([
          'url',
          'file',
          'datasource',
        ]);
      },
    }),
});

export default allowedCatalogLocationTypesModule;
