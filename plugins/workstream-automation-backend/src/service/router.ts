import { MiddlewareFactory } from '@backstage/backend-defaults/rootHttpRouter';
import { resolvePackagePath } from '@backstage/backend-plugin-api';
import { ConflictError, NotAllowedError } from '@backstage/errors';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import {
  workstreamCreatePermission,
  workstreamDeletePermission,
  WorkstreamEntity,
  workstreamUpdatePermission,
} from '@compass/backstage-plugin-workstream-automation-common';
import express from 'express';
import { Knex } from 'knex';
import { v4 } from 'uuid';
import { WorkstreamBackendDatabase } from '../database';
import { DEFAULT_WORKSTREAM_NAMESPACE } from '../modules/lib/constants';
import { workstreamToEntityKind } from '../modules/lib/utils';
import { workstreamPermissionResourceRef } from '../permissions/resources';
import { isWorkstreamLead } from '../permissions/rules';
import { Workstream } from '../types';
import artRouter from './artRouter';
import { noteRouter } from './noteRouter';
import { RouterOptions } from './types';

const migrationsDir = resolvePackagePath(
  '@compass/backstage-plugin-workstream-automation-backend',
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
  const {
    logger,
    config,
    auth,
    discovery,
    permissions,
    httpAuth,
    catalog: catalogApi,
    permissionsRegistry,
  } = options;

  const router = express.Router();
  const dbClient = await options.database.getClient();

  await createDatabaseSchema({
    knex: dbClient,
    skipMigrations: false,
  });

  const workstreamDatabaseClient = new WorkstreamBackendDatabase(dbClient);

  const apiBaseUrl = await discovery.getBaseUrl('workstream');

  permissionsRegistry.addResourceType({
    resourceRef: workstreamPermissionResourceRef,
    rules: [isWorkstreamLead],
    permissions: [workstreamUpdatePermission],
    getResources: async entityRefs => {
      const resp = await catalogApi.getEntitiesByRefs(
        {
          entityRefs: entityRefs,
          filter: [{ kind: 'Workstream' }],
        },
        {
          credentials: await auth.getOwnServiceCredentials(),
        },
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

  router.use('/art', await artRouter(options));

  router.use('/note', await noteRouter(options));

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
    await catalogApi.addLocation(
      {
        target: workstreamLocation,
        type: 'url',
      },
      { credentials: await auth.getOwnServiceCredentials() },
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
    const catalogServiceCredentials = {
      credentials: await auth.getOwnServiceCredentials(),
    };
    if (workstreamName !== updatedData.name) {
      // remove original location
      const currLoc = await catalogApi.getLocationByEntity(
        `workstream:${DEFAULT_WORKSTREAM_NAMESPACE}/${workstreamName}`,
        catalogServiceCredentials,
      );
      await catalogApi.removeLocationById(
        currLoc?.id ?? '',
        catalogServiceCredentials,
      );

      // add new location with updated target name
      await catalogApi.addLocation(
        {
          type: 'url',
          target: `${apiBaseUrl}/${updatedData.name}`,
        },
        catalogServiceCredentials,
      );
      return res.status(200).json({
        data: result,
        message:
          'Workstream updated successfully (please refresh entity to view changes)',
      });
    }

    await catalogApi.refreshEntity(
      `workstream:${DEFAULT_WORKSTREAM_NAMESPACE}/${workstreamName}`,
      catalogServiceCredentials,
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
      const catalogServiceCredentials = {
        credentials: await auth.getOwnServiceCredentials(),
      };

      const resp = await catalogApi.getLocationByRef(
        `url:${apiBaseUrl}/${result.name}`,
        catalogServiceCredentials,
      );
      if (resp)
        await catalogApi.removeLocationById(resp.id, catalogServiceCredentials);
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
