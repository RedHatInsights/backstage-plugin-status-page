import express from 'express';
import Router from 'express-promise-router';
import { DataLayerBackendDatabase } from './database/DataLayerBackendDatabase';
import { DatabaseService } from '@backstage/backend-plugin-api';

export async function createRouter(
  databaseServer: DatabaseService,
): Promise<express.Router> {
  const router = Router();
  router.use(express.json());
  const database = await DataLayerBackendDatabase.create({
    knex: await databaseServer.getClient(),
    skipMigrations: false,
  });

  router.get('/search', async (req, res) => {
    const subgraph = req.query.subgraph || '';

    if (subgraph) {
      const cachedData = await database.getSearchDataBySubgraph(
        subgraph.toString(),
      );
      res.json({ data: cachedData });
    } else {
      res.json({ data: [], info: 'search triggered' });
    }
  });

  router.get('/subgraphs', async (_req, res) => {
    const cachedData = await database.getSubgraphsData();
    res.json({ data: cachedData });
  });

  router.get('/subgraphs/errors', async (req, res) => {
    const subgraph = req.query.subgraph || '';
    if (subgraph) {
      const cachedData = await database.getErrorDataBySubgraph(
        subgraph.toString(),
      );
      res.json({ data: cachedData });
    } else {
      res.json({ data: [] });
    }
  });

  router.get('/gateway/requests', async (_req, res) => {
    const cachedData = await database.getGateWayRequests();
    res.json({ data: cachedData });
  });

  router.get('/gateway/response-time', async (_req, res) => {
    const cachedData = await database.getResponseTimeData();
    res.json({ data: cachedData });
  });

  router.get('/gateway/query-source', async (_req, res) => {
    const isPublic = true;
    const publicData = await database.getQueryTypeData(isPublic);
    const internalData = await database.getQueryTypeData(!isPublic);
    res.json({ data: { internal: internalData, external: publicData } });
  });

  return router;
}
