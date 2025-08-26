import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { JiraEntityProcessor } from './JiraEntityProcessor';

export const catalogModuleJira = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'aixway',
  register(reg) {
    reg.registerInit({
      deps: {
        catalog: catalogProcessingExtensionPoint,
        discovery: coreServices.discovery,
        logger: coreServices.logger,
      },
      async init({
        catalog,
        discovery,
        logger,
      }) {
        // Only register the processor for enriching existing entities
        catalog.addProcessor(new JiraEntityProcessor({
          discovery,
          logger,
        }));
      },
    });
  },
});

// Default export for dynamic import
export default catalogModuleJira;