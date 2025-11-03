import express from 'express';
import { DatasourceDatabaseStore } from '../database/DatasourceDatabaseStore';
import { createOpenApiRouter } from '../schema/openapi';
import {
  createDatasourceParser,
  stringifyDatasourceRef,
} from '@compass/backstage-plugin-datasource-common';
import { RouterOptions } from './types';
import { createDatabaseSchema, knexNow } from './utils';
import { v4 as uuidV4 } from 'uuid';

export async function createRouter({
  httpAuth,
  database,
  catalog,
  auth,
}: RouterOptions): Promise<express.Router> {
  const router = await createOpenApiRouter({
    validatorOptions: {
      validateRequests: true,
      validateFormats: 'full',
      validateApiSpec: true,
    },
  });

  router.use(express.json());

  await createDatabaseSchema({
    knex: await database.getClient(),
    skipMigrations: database.migrations?.skip ?? false,
  });

  const dbClient = new DatasourceDatabaseStore(await database.getClient());

  router.get('/', async (_, res) => {
    const data = await dbClient.getAllDatasources();
    res.status(200).json(data);
    return;
  });

  router.post(
    '/',
    (req, _, next) => {
      createDatasourceParser.parse(req.body);
      next();
    },
    async (req, res) => {
      const data = req.body;
      const credentials = await httpAuth.credentials(req, {
        allow: ['user', 'service'],
      });

      let createdBy = '';
      if (credentials.principal.type === 'user')
        createdBy = credentials.principal.userEntityRef;
      else if (credentials.principal.type === 'service')
        createdBy = credentials.principal.subject;

      const createdData = await dbClient.createDatasource({
        ...data,
        id: uuidV4(),
        createdAt: knexNow(),
        createdBy: createdBy,
        updatedAt: knexNow(),
        updatedBy: createdBy,
      });

      try {
        const locResp = await catalog.addLocation(
          {
            type: 'datasource',
            target: stringifyDatasourceRef({
              namespace: createdData.namespace,
              name: createdData.name,
            }),
          },
          { credentials: await httpAuth.credentials(req) },
        );
        console.log(locResp);
      } catch (err: any) {
        res.status(500).json({ message: 'Internal Error', stack: err });
        return;
      }

      res.status(200).json(createdData);
      return;
    },
  );

  router.get('/:namespace/:name', async (req, res) => {
    try {
      const datasourceId = req.params.name;

      const data = await dbClient.getDatasourceById(
        datasourceId,
        req.params.namespace,
      );
      if (!data) {
        res.status(404).json({
          message: 'Datasource not found',
        });
        return;
      }
      res.status(200).json(data);
    } catch (error: any) {
      res.status(500).json({
        message: 'Something went wrong',
        stack: JSON.stringify(error),
      });
    }
    return;
  });

  router.delete('/:namespace/:name', async (req, res) => {
    try {
      const name = req.params.name;
      const namespace = req.params.namespace;
      const data = await dbClient.getDatasourceById(name, namespace);
      if (!data) {
        res.status(404).json({
          message: 'Datasource not found',
        });
        return;
      }
      if (await dbClient.deleteDatasource(name, namespace)) {
        const resp = await catalog.getLocationByRef(
          `datasource:${stringifyDatasourceRef({ namespace, name })}`,
          {
            credentials: await auth.getOwnServiceCredentials(),
          },
        );
        if (resp)
          await catalog.removeLocationById(resp.id, {
            credentials: await auth.getOwnServiceCredentials(),
          });
        res.sendStatus(410);
      } else res.sendStatus(500);
    } catch (e: any) {
      res.status(500).json({
        message: 'Something went wrong',
        stack: JSON.stringify(e),
      });
    }
    return;
  });

  return router;
}
