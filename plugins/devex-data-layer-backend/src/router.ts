import express from 'express';
import Router from 'express-promise-router';
import { DataLayerBackendDatabase } from './database/DataLayerBackendDatabase';
import { DatabaseService } from '@backstage/backend-plugin-api';
import { SplunkSearchServices } from './types';

export async function createRouter(
  splunkSearchService: SplunkSearchServices,
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
      splunkSearchService.fetchHistoricalData();
      res.json({ data: [], info: 'search triggered' });
    }
  });

  return router;
}
