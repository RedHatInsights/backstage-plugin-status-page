import { MiddlewareFactory } from '@backstage/backend-defaults/rootHttpRouter';
import {
  AuthService,
  DatabaseService,
  DiscoveryService,
  LoggerService,
  RootConfigService,
} from '@backstage/backend-plugin-api';
import { CatalogClient } from '@backstage/catalog-client';
import express from 'express';
import Router from 'express-promise-router';
import { WorkstreamBackendDatabase } from '../database';
import { WorkstreamIntegration } from '../modules/integrations/WorkstreamIntegration';
import { workstreamToEntityKind } from '../modules/lib/utils';
import { Workstream } from '../types';
import { DEFAULT_WORKSTREAM_NAMESPACE } from '../modules/lib/constants';

export interface RouterOptions {
  logger: LoggerService;
  config: RootConfigService;
  database: DatabaseService;
  auth: AuthService;
  discovery: DiscoveryService;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger, config, auth, discovery } = options;

  const router = Router();
  const database = await WorkstreamBackendDatabase.create({
    knex: await options.database.getClient(),
    skipMigrations: false,
  });
  const integrations = WorkstreamIntegration.fromConfig(config);
  const catalogApi = new CatalogClient({ discoveryApi: discovery });

  router.use(express.json());

  router.get('/health', (_, response) => {
    logger.info('PONG!');
    response.json({ status: 'ok' });
  });

  // TODO create filters for member, pillar, lead, jira_project
  router.get('/', async (_req, res) => {
    const result = await database.listWorkstreams();
    res.status(200).json({ data: result });
  });

  router.post('/', async (req, res) => {
    if (!req.body.data) {
      res.status(400).json({ error: 'Request body incomplete' });
      return;
    }
    const worksteamData: Workstream = req.body.data;
    const result = await database.insertWorkstream(worksteamData);
    const integration = integrations.byHost(req.hostname);

    if (!integration)
      throw new Error(`Integration for host: ${req.hostname} missing`);

    const workstreamLocation = `${integration.apiBaseUrl}/${result.name}`;
    const credentials = await auth.getPluginRequestToken({
      targetPluginId: 'catalog',
      onBehalfOf: await auth.getOwnServiceCredentials(),
    });
    await catalogApi.addLocation(
      {
        target: workstreamLocation,
        type: 'url',
      },
      credentials,
    );

    res.status(200).json({ data: result });
  });

  router.put('/:workstream_name', async (req, res) => {
    if (!req.body.data) {
      return res.status(400).json({ error: 'Invalid data provided' });
    }
    const data: Partial<Workstream> = req.body.data;
    const workstreamName = req.params.workstream_name;

    const originalData = await database.getWorkstreamById(workstreamName);
    if (originalData === null) {
      return res.status(404).json({
        error: `${workstreamName} workstream not found`,
      });
    }

    const updatedData: Workstream = {
      ...originalData,
      ...data,
    };
    const result = await database.updateWorkstream(workstreamName, updatedData);
    if (result === null) {
      return res.status(500).json({
        error: 'Something went wrong',
      });
    }

    const namespace =
      integrations.byHost(req.hostname)?.config.namespace ??
      DEFAULT_WORKSTREAM_NAMESPACE;
    const credentials = await auth.getPluginRequestToken({
      targetPluginId: 'catalog',
      onBehalfOf: await auth.getOwnServiceCredentials(),
    });
    catalogApi.refreshEntity(
      `workstream:${namespace}/${workstreamName}`,
      credentials,
    );

    return res.status(200).json({ data: result });
  });

  router.get('/:workstream_name', async (req, res) => {
    const name = req.params.workstream_name;
    const result = await database.getWorkstreamById(name);

    if (result) {
      const integration = integrations.byHost(req.hostname);

      if (!integration)
        throw new Error(`Integration for host: ${req.hostname} missing`);

      const workstreamEntity = workstreamToEntityKind({
        data: result,
        location: `${integration.apiBaseUrl}/${result.name}`,
        namespace: integration.config.namespace,
      });
      return res.status(200).json(workstreamEntity);
    }
    return res.status(404).json({
      error: 'workstream not found',
    });
  });

  router.delete('/:workstream_name', async (req, res) => {
    const name = req.params.workstream_name;
    const result = await database.getWorkstreamById(name);

    if (result) {
      await database.deleteWorkstream(name);
      return res.status(200).json({ message: 'Deleted successfully' });
    }
    return res.status(404).json({
      error: 'workstream not found',
    });
  });

  const middleware = MiddlewareFactory.create({ logger, config });

  router.use(middleware.error());
  return router;
}
