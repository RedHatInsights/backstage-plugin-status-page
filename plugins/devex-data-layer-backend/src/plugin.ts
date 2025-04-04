import {
  SchedulerServiceTaskScheduleDefinition,
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './router';
import { CreateSplunkQueryService } from './services/SplunkSearchServices';

/**
 * devexDataLayerPlugin backend plugin
 *
 * @public
 */
export const devexDataLayerPlugin = createBackendPlugin({
  pluginId: 'devex-data-layer',
  register(env) {
    env.registerInit({
      deps: {
        logger: coreServices.logger,
        auth: coreServices.auth,
        config: coreServices.rootConfig,
        httpRouter: coreServices.httpRouter,
        database: coreServices.database,
        scheduler: coreServices.scheduler,
      },
      async init({ logger, auth, httpRouter, config, database, scheduler }) {
        try {
        const token = config.getOptionalString('dataLayer.splunkToken') || '';
        const subgraphsSnippetUrl =
          config.getOptionalString('dataLayer.splunkSubgraphsSnippet') || '';
        const splunkApiHost =
          config.getOptionalString('dataLayer.splunkApiHost') || '';

        const splunkQueryService = await CreateSplunkQueryService({
          logger,
          auth,
          splunkApiHost,
          token,
          database,
          subgraphsSnippetUrl,
        });

        const schedulerConfig: SchedulerServiceTaskScheduleDefinition =
          config.getOptional('dataLayer.schedule') || {
            timeout: { hours: 6 },
            frequency: { hours: 12 },
          };

        // scheduled to sync the splunk data
        const runner = scheduler.createScheduledTaskRunner(schedulerConfig);
        runner.run({
          fn: () => {
            splunkQueryService.fetchHistoricalData();
          },
          id: 'splunk-query-service-runner__id',
        });

        httpRouter.use(await createRouter(database));
      }

    catch(err) {
      logger.error(String(err));
    }
    }});
  },
});
