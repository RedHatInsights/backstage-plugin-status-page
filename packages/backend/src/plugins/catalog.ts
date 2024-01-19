import { CatalogBuilder } from '@backstage/plugin-catalog-backend';
import { ScaffolderEntitiesProcessor } from '@backstage/plugin-catalog-backend-module-scaffolder-entity-model';
import { UnprocessedEntitiesModule } from '@backstage/plugin-catalog-backend-module-unprocessed';
import { Router } from 'express';
import { PluginEnvironment } from '../types';
import { CMDBDiscoveryEntityProvider, BusinessApplicationEntityProcessor } from '@appdev-platform/backstage-plugin-catalog-backend-module-cmdb';
import { SPAshipDiscoveryEntityProvider } from '@appdev-platform/backstage-plugin-catalog-backend-module-spaship';
import { CatalogClient } from '@backstage/catalog-client';

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  const builder = await CatalogBuilder.create(env);
  builder.addProcessor(new ScaffolderEntitiesProcessor());

  const cmdbProvider = CMDBDiscoveryEntityProvider.fromConfig(env.config, {
    logger: env.logger,
    scheduler: env.scheduler,
  });

  const catalog = new CatalogClient({
    discoveryApi: env.discovery
  });

  const cmdbProcessor = new BusinessApplicationEntityProcessor(catalog);

  const spashipProvider = SPAshipDiscoveryEntityProvider.fromConfig(env.config, {
    logger: env.logger,
    scheduler: env.scheduler,
  });

  builder.addEntityProvider(...cmdbProvider, ...spashipProvider);
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
