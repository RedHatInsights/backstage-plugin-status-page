import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { MCPServerProcessor } from './MCPServerProcessor';
import { MCPRegistryProvider } from './MCPServerProvider';

export const catalogModuleMcp = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'mcp-server',
  register(reg) {
    reg.registerInit({
      deps: {
        config: coreServices.rootConfig,
        catalog: catalogProcessingExtensionPoint,
        logger: coreServices.logger,
        scheduler: coreServices.scheduler,
      },
      async init({ catalog, config, logger, scheduler }) {
        logger.info('MCP Server Plugin!');
        const catalogProcessor = new MCPServerProcessor({
          logger,
        });
        catalog.addProcessor(catalogProcessor);
        catalog.addEntityProvider(
          MCPRegistryProvider.fromConfig(config, {
            logger,
            scheduler,
          }),
        );
      },
    });
  },
});
