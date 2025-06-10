import {
  RESOURCE_TYPE_WORKSTREAM_ENTITY,
  workstreamCreatePermission,
  WorkstreamEntity,
  workstreamDeletePermission,
  workstreamPermissions,
  workstreamUpdatePermission,
} from '@appdev-platform/backstage-plugin-workstream-automation-common';
import { MiddlewareFactory } from '@backstage/backend-defaults/rootHttpRouter';
import {
  AuthService,
  DatabaseService,
  DiscoveryService,
  HttpAuthService,
  LoggerService,
  PermissionsService,
  resolvePackagePath,
  RootConfigService,
} from '@backstage/backend-plugin-api';
import { CatalogClient } from '@backstage/catalog-client';
import { ConflictError, NotAllowedError } from '@backstage/errors';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import { createPermissionIntegrationRouter } from '@backstage/plugin-permission-node';
import express from 'express';
import { WorkstreamBackendDatabase } from '../database';
import { DEFAULT_WORKSTREAM_NAMESPACE } from '../modules/lib/constants';
import { workstreamToEntityKind } from '../modules/lib/utils';
import { workstreamPermissionRules } from '../permissions/rules';
import { Workstream } from '../types';
import { v4 } from 'uuid';
import artRouter from './artRouter';
import { Knex } from 'knex';
import { ArtBackendDatabase } from '../database/ArtBackendDatabase';

export interface RouterOptions {
  logger: LoggerService;
  config: RootConfigService;
  database: DatabaseService;
  auth: AuthService;
  discovery: DiscoveryService;
  permissions: PermissionsService;
  httpAuth: HttpAuthService;
}

const migrationsDir = resolvePackagePath(
  '@appdev-platform/backstage-plugin-workstream-automation-backend',
  'migrations',
);

async function createDatabaseSchema(options: {
  knex: Knex;
  skipMigrations: boolean;
}) {
  const database = options.knex;

  if (!options.skipMigrations)
    await database.migrate.latest({
      directory: migrationsDir,
    });
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger, config, auth, discovery, permissions, httpAuth } = options;

  const router = express.Router();
  const dbClient = await options.database.getClient();

  await createDatabaseSchema({
    knex: dbClient,
    skipMigrations: false,
  });

  const workstreamDatabaseClient = new WorkstreamBackendDatabase(dbClient);
  const artDatabaseClient = new ArtBackendDatabase(dbClient);

  const catalogApi = new CatalogClient({ discoveryApi: discovery });
  const apiBaseUrl = await discovery.getBaseUrl('workstream');

  const permissionIntegrationRouter = createPermissionIntegrationRouter({
    permissions: workstreamPermissions,
    resourceType: RESOURCE_TYPE_WORKSTREAM_ENTITY,
    rules: Object.values(workstreamPermissionRules),
    getResources: async resourceRefs => {
      const credentials = await auth.getPluginRequestToken({
        onBehalfOf: await auth.getOwnServiceCredentials(),
        targetPluginId: 'catalog',
      });
      const resp = await catalogApi.getEntitiesByRefs(
        {
          entityRefs: resourceRefs,
          filter: [{ kind: 'Workstream' }],
        },
        credentials,
      );
      const { items: workstreamEntities } = resp;
      return workstreamEntities as WorkstreamEntity[];
    },
  });

  router.use(express.json());

  router.get('/health', (_, response) => {
    logger.info('PONG!');
    response.json({ status: 'ok' });
  });

  router.use(permissionIntegrationRouter);

  router.use(
    '/art',
    await artRouter({
      ...options,
      artDatabaseClient,
      catalogApi,
    }),
  );

  // TODO create filters for member, pillar, lead, jira_project
  router.get('/', async (_req, res) => {
    const result = await workstreamDatabaseClient.listWorkstreams();
    res.status(200).json({ data: result });
  });

  router.post('/', async (req, res) => {
    const credentials = await httpAuth.credentials(req);
    const decision = (
      await permissions.authorize(
        [{ permission: workstreamCreatePermission }],
        { credentials: credentials },
      )
    )[0];
    if (decision.result === AuthorizeResult.DENY) {
      throw new NotAllowedError('Unauthorized');
    }
    if (!req.body.data) {
      res.status(400).json({ error: 'Request body incomplete' });
      return;
    }
    req.body.data.workstreamId = v4();
    const worksteamData: Workstream = req.body.data;
    worksteamData.links = worksteamData.links ?? [];

    if (await workstreamDatabaseClient.getWorkstreamById(worksteamData.name)) {
      throw new ConflictError(
        `Workstream ${worksteamData.name} already exists`,
      );
    }
    const result = await workstreamDatabaseClient.insertWorkstream(
      worksteamData,
    );

    const workstreamLocation = `${apiBaseUrl}/${result.name}`;
    const { token: catalogServiceToken } = await auth.getPluginRequestToken({
      targetPluginId: 'catalog',
      onBehalfOf: await auth.getOwnServiceCredentials(),
    });
    await catalogApi.addLocation(
      {
        target: workstreamLocation,
        type: 'url',
      },
      { token: catalogServiceToken },
    );

    res.status(200).json({ data: result });
  });

  router.put('/:workstream_name', async (req, res) => {
    const workstreamName = req.params.workstream_name;
    const credentials = await httpAuth.credentials(req);
    const decision = (
      await permissions.authorize(
        [
          {
            permission: workstreamUpdatePermission,
            resourceRef: `workstream:${DEFAULT_WORKSTREAM_NAMESPACE}/${workstreamName}`,
          },
        ],
        { credentials },
      )
    )[0];
    if (decision.result === AuthorizeResult.DENY) {
      throw new NotAllowedError('Unauthorized');
    }

    if (!req.body.data) {
      return res.status(400).json({ error: 'Invalid data provided' });
    }
    const data: Partial<Workstream> = req.body.data;

    const originalData = await workstreamDatabaseClient.getWorkstreamById(
      workstreamName,
    );
    if (originalData === null) {
      return res.status(404).json({
        error: `${workstreamName} workstream not found`,
      });
    }

    const updatedData: Workstream = {
      ...originalData,
      ...data,
    };

    const result = await workstreamDatabaseClient.updateWorkstream(
      workstreamName,
      updatedData,
    );
    if (result === null) {
      return res.status(500).json({
        error: 'Something went wrong',
      });
    }
    const catalogServiceToken = await auth.getPluginRequestToken({
      targetPluginId: 'catalog',
      onBehalfOf: await auth.getOwnServiceCredentials(),
    });
    if (workstreamName !== updatedData.name) {
      // remove original location
      const currLoc = await catalogApi.getLocationByEntity(
        `workstream:${DEFAULT_WORKSTREAM_NAMESPACE}/${workstreamName}`,
        catalogServiceToken,
      );
      await catalogApi.removeLocationById(
        currLoc?.id ?? '',
        catalogServiceToken,
      );

      // add new location with updated target name
      await catalogApi.addLocation(
        {
          type: 'url',
          target: `${apiBaseUrl}/${updatedData.name}`,
        },
        catalogServiceToken,
      );
      return res.status(200).json({
        data: result,
        message:
          'Workstream updated successfully (please refresh entity to view changes)',
      });
    }

    await catalogApi.refreshEntity(
      `workstream:${DEFAULT_WORKSTREAM_NAMESPACE}/${workstreamName}`,
      catalogServiceToken,
    );

    return res.status(200).json({
      data: result,
      message:
        'Workstream updated successfully (please refresh entity to view changes)',
    });
  });

  router.get('/:workstream_name', async (req, res) => {
    const name = req.params.workstream_name;
    const result = await workstreamDatabaseClient.getWorkstreamById(name);

    if (result) {
      const workstreamEntity = workstreamToEntityKind({
        data: result,
        location: `${apiBaseUrl}/${result.name}`,
        namespace: DEFAULT_WORKSTREAM_NAMESPACE,
      });
      return res.status(200).json(workstreamEntity);
    }
    return res.status(404).json({
      error: 'workstream not found',
    });
  });

  router.delete('/:workstream_name', async (req, res) => {
    const credentials = await httpAuth.credentials(req);
    const decision = (
      await permissions.authorize(
        [{ permission: workstreamDeletePermission }],
        { credentials },
      )
    )[0];
    if (decision.result === AuthorizeResult.DENY) {
      throw new NotAllowedError('Unauthorized');
    }
    const name = req.params.workstream_name;
    const result = await workstreamDatabaseClient.getWorkstreamById(name);

    if (result) {
      const { token: catalogServiceToken } = await auth.getPluginRequestToken({
        targetPluginId: 'catalog',
        onBehalfOf: await auth.getOwnServiceCredentials(),
      });

      const resp = await catalogApi.getLocationByRef(
        `url:${apiBaseUrl}/${result.name}`,
        { token: catalogServiceToken },
      );
      if (resp)
        await catalogApi.removeLocationById(resp.id, {
          token: catalogServiceToken,
        });
      await workstreamDatabaseClient.deleteWorkstream(name);
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
