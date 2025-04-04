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

  return router;
}
