import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { factCollectionExtensionPoint } from '@spotify/backstage-plugin-soundcheck-node';
import { GoogleSpreadsheetsFactCollector } from './FactCollector/GoogleSpreadsheetsFactCollector';
import { ConfigSchema } from './schemas/ConfigSchema';

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
          logger.warn(
            '[google-spreadsheets] collector config is missing; module is not running',
          );
          return;
        }
        if (!ConfigSchema.safeParse(collectorConfig.get()).success) {
          logger.error('[google-spreadsheets] error while parsing config', {
            stack: ConfigSchema.safeParse(collectorConfig.get()).error?.stack,
          });
          logger.warn('[google-spreadsheets] module is not running');
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
