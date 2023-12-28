import { CatalogBuilder } from '@backstage/plugin-catalog-backend';
import { ScaffolderEntitiesProcessor } from '@backstage/plugin-catalog-backend-module-scaffolder-entity-model';
import { UnprocessedEntitiesModule } from '@backstage/plugin-catalog-backend-module-unprocessed';
import { Router } from 'express';
import { PluginEnvironment } from '../types';
import { CMDBDiscoveryEntityProvider, BusinessApplicationEntityProcessor } from '@appdev-platform/backstage-plugin-catalog-backend-module-cmdb';

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  const builder = await CatalogBuilder.create(env);
  builder.addProcessor(new ScaffolderEntitiesProcessor());

  const cmdbProvider = CMDBDiscoveryEntityProvider.fromConfig(env.config, {
    logger: env.logger,
    scheduler: env.scheduler,
  });

  const cmdbProcessor = new BusinessApplicationEntityProcessor();

  builder.addEntityProvider(...cmdbProvider);
  builder.addProcessor(cmdbProcessor);

  const { processingEngine, router } = await builder.build();
  await processingEngine.start();

  const unprocessed = new UnprocessedEntitiesModule(
    (await env.database.getClient()) as any,
    router,
  );
  unprocessed.registerRoutes();

  return router;
}
