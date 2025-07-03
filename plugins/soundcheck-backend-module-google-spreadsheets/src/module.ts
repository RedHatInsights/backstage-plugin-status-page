import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { factCollectionExtensionPoint } from '@spotify/backstage-plugin-soundcheck-node';
import { GoogleSpreadsheetsFactCollector } from './FactCollector/GoogleSpreadsheetsFactCollector';

export const soundcheckModuleGoogleSpreadsheet = createBackendModule({
  pluginId: 'soundcheck',
  moduleId: 'google-spreadsheet',
  register(reg) {
    reg.registerInit({
      deps: {
        logger: coreServices.logger,
        cache: coreServices.cache,
        config: coreServices.rootConfig,
        factCollector: factCollectionExtensionPoint,
      },
      async init({ logger, cache, config, factCollector }) {
        const collectorConfig = config.getOptionalConfig(
          'soundcheck.collectors.googleSpreadsheets',
        );
        if (!collectorConfig) {
          logger.error('[google-spreadsheets] collector config is missing');
          return;
        }
        factCollector.addFactCollector(
          GoogleSpreadsheetsFactCollector.create(
            cache,
            collectorConfig,
            logger,
          ),
        );
        logger.info('[google-spreadsheets] module is running');
      },
    });
  },
});
