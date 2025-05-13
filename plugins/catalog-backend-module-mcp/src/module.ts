import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { MCPEntityProcessor } from './modules';

export const catalogModuleMcp = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'mcp-server',
  register(reg) {
    reg.registerInit({
      deps: {
        catalog: catalogProcessingExtensionPoint,
        logger: coreServices.logger,
      },
      async init({ catalog,  logger  }) {
        logger.info('MCP Server Plugin!');
        const catalogProcessor = new MCPEntityProcessor({
          logger
        });
        catalog.addProcessor(catalogProcessor);
      },
    });
  },
});


