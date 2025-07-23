import express from 'express';
import Router from 'express-promise-router';
import { DataLayerBackendDatabase } from './database/DataLayerBackendDatabase';
import { DatabaseService } from '@backstage/backend-plugin-api';
import { HydraSplunkDatabase } from './database/HydraSplunkDatabase';
import { HydraNotificationsLogIds } from './services/SplunkSearchServices';
import {
  HydraAttachmentLogIds,
  HydraCaseBotLogIds,
  HydraRestLogIds,
  HydraSearchLogIds,
} from './services/SplunkSearchServices/constants';

export async function createRouter(
  databaseServer: DatabaseService,
): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  // DB instance for DATA-LAYER backend
  const database = await DataLayerBackendDatabase.create({
    knex: await databaseServer.getClient(),
    skipMigrations: false,
  });

  // DB instance for Hydra Dashboard backend
  const hydraDatabase = await HydraSplunkDatabase.create({
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

  router.get('/hydra/notifications/active-users', async (_req, res) => {
    const cachedData = await hydraDatabase.getSearchDataByLogId(
      HydraNotificationsLogIds.ActiveUsers,
    );
    res.json({ data: cachedData });
  });

  router.get('/hydra/notifications/count', async (_req, res) => {
    const cachedData = await hydraDatabase.getSearchDataByLogId(
      HydraNotificationsLogIds.NotificationsServed,
    );
    res.json({ data: cachedData });
  });

  router.get('/hydra/notifications/by-channel', async (_req, res) => {
    const cachedData = await hydraDatabase.getSearchDataByLogId(
      HydraNotificationsLogIds.NotificationsPerChannel,
    );
    res.json({ data: cachedData });
  });

  router.get('/hydra/attachments/unique-users', async (_req, res) => {
    const cachedData = await hydraDatabase.getSearchDataByLogId(
      HydraAttachmentLogIds.UniqueUsers,
    );
    res.json({ data: cachedData });
  });

  router.get('/hydra/attachments/downloads', async (_req, res) => {
    const cachedData = await hydraDatabase.getSearchDataByLogId(
      HydraAttachmentLogIds.AttachmentsDownloads,
    );
    res.json({ data: cachedData });
  });

  router.get('/hydra/attachments/uploads', async (_req, res) => {
    const cachedData = await hydraDatabase.getSearchDataByLogId(
      HydraAttachmentLogIds.AttachmentsUploads,
    );
    res.json({ data: cachedData });
  });

  router.get('/hydra/casebot/unique-users', async (_req, res) => {
    const cachedData = await hydraDatabase.getSearchDataByLogId(
      HydraCaseBotLogIds.UniqueUsers,
    );
    res.json({ data: cachedData });
  });

  router.get('/hydra/casebot/commands', async (_req, res) => {
    const cachedData = await hydraDatabase.getSearchDataByLogId(
      HydraCaseBotLogIds.FrequencyPerCommand,
    );
    res.json({ data: cachedData });
  });

  router.get('/hydra/search/unique-users', async (_req, res) => {
    const cachedData = await hydraDatabase.getSearchDataByLogId(
      HydraSearchLogIds.UniqueUsers,
    );
    res.json({ data: cachedData });
  });

  router.get('/hydra/search/requests', async (_req, res) => {
    const cachedData = await hydraDatabase.getSearchDataByLogId(
      HydraSearchLogIds.SearchRequest,
    );
    res.json({ data: cachedData });
  });

  router.get('/hydra/rest/unique-users', async (_req, res) => {
    const cachedData = await hydraDatabase.getSearchDataByLogId(
      HydraRestLogIds.UniqueUsers,
    );
    res.json({ data: cachedData });
  });

  router.get('/hydra/rest/cases', async (_req, res) => {
    const cachedData = await hydraDatabase.getSearchDataByLogId(
      HydraRestLogIds.CasesCreated,
    );
    res.json({ data: cachedData });
  });
  router.get('/health', (_, res) => res.json({ status: 'ok' }));

  return router;
}
