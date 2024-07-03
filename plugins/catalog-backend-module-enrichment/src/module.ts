import { coreServices, createBackendModule } from '@backstage/backend-plugin-api';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { EnrichmentDataProcessor } from './EnrichmentDataProcessor';
import { CatalogClient } from '@backstage/catalog-client';

export const catalogModuleEnrichment = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'enrichment',
  register(reg) {
    reg.registerInit({
      deps: { 
        catalog: catalogProcessingExtensionPoint,
        discovery: coreServices.discovery,
        auth: coreServices.auth,
        logger: coreServices.logger,
       },
      async init({ catalog, discovery, auth, logger }) {
        const catalogApi = new CatalogClient({
          discoveryApi: discovery,
        });

        const enrichmentProcessor = new EnrichmentDataProcessor({
          auth,
          catalogApi,
          discovery: discovery,
          logger,
        });

        catalog.addProcessor(enrichmentProcessor);
      },
    });
  },
});
