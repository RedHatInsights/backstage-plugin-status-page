import { HttpAuthService, LoggerService } from '@backstage/backend-plugin-api';
import express from 'express';
import Router from 'express-promise-router';
import {
  IncidentServiceType,
  PostmortemServiceType,
  TemplateServiceType,
} from './services';
import { DatabaseService } from '@backstage/backend-plugin-api';
import { IncidentsDatabase } from './database/IncidentsDatabase';
import { actionsRegistryServiceRef } from '@backstage/backend-plugin-api/alpha';

export async function createRouter({
  incidentFetchService,
  postmortemFetchService,
  templateFetchService,
  logger,
  databaseServer,
}: {
  httpAuth: HttpAuthService;
  incidentFetchService: IncidentServiceType;
  postmortemFetchService: PostmortemServiceType;
  templateFetchService: TemplateServiceType;
  logger: LoggerService;
  databaseServer: DatabaseService;
  actionsRegistry: typeof actionsRegistryServiceRef; 
}): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  const database = await IncidentsDatabase.create({
    knex: await databaseServer.getClient(),
    skipMigrations: false,
  });

  router.get('/incidents', async (req, res) => {
    const cookie = req.headers?.cookie;
    const response = await incidentFetchService.getIncidents(cookie);
    res.json({ data: response });
  });

  router.get('/incidents/:id', async (req, res) => {
    const incidentId = req.params.id;
    const cookie = req.headers?.cookie;
    const response = await incidentFetchService.getIncidentsById(
      incidentId,
      cookie,
    );
    res.json({ data: response });
  });

  router.get('/components', async (req, res) => {
    const cookie = req.headers?.cookie;
    const response = await incidentFetchService.getComponents(cookie);
    res.json({ data: response });
  });

  router.post('/incidents', async (req, res) => {
    try {
      const cookie = req.headers?.cookie;
      const body = req.body.incident;
      const response = await incidentFetchService.createIncident(body, cookie);
      res.json({ data: response });
    } catch (err) {
      res.json({ data: [], message: 'Error: Failed to create incident!' });
    }
  });

  router.patch('/incidents/:id', async (req, res) => {
    try {
      const cookie = req.headers?.cookie;
      const incidentId = req.params.id;
      const body = req.body.incident;
      const response = await incidentFetchService.updateIncident(
        incidentId,
        body,
        cookie,
      );
      res.json({ data: response });
    } catch (err) {
      res.json({ data: [], message: 'Error: Failed to update incident!' });
    }
  });

  router.delete('/incidents/:id', async (req, res) => {
    try {
      const cookie = req.headers?.cookie;
      const incidentId = req.params.id;
      const response = await incidentFetchService.deleteIncident(
        incidentId,
        cookie,
      );
      res.json({ data: response });
    } catch (err) {
      res.json({ data: [], message: 'Error: Failed to delete incident!' });
    }
  });
  router.get('/health', (_, res) => res.json({ status: 'ok' }));

  router.post('/postmortem/:id/draft', async (req, res) => {
    try {
      const cookie = req.headers?.cookie;
      const incidentId = req.params.id;
      const body = req.body;
      const response = await postmortemFetchService.draftPostmortem(
        incidentId,
        body,
        cookie,
      );
      res.json({ data: response });
    } catch (err) {
      res.json({ data: [], message: 'Error: Failed to save postmortem!' });
    }
  });

  router.post('/postmortem/:id/publish', async (req, res) => {
    try {
      const cookie = req.headers?.cookie;
      const incidentId = req.params.id;
      const body = req.body;
      const response = await postmortemFetchService.publishPostmortem(
        incidentId,
        body,
        cookie,
      );
      res.json({ data: response });
    } catch (err) {
      res.json({ data: [], message: 'Error: Failed to publish postmortem!' });
    }
  });

  router.post('/templates', async (req, res) => {
    try {
      const body = req.body;
      const response = await templateFetchService.createTemplate(
        body,
        database,
      );
      res.json({ data: response, message: 'Template created successfully' });
    } catch (err) {
      res.json({ data: [], message: 'Error: Failed to create template!' });
    }
  });

  router.get('/templates', async (_req, res) => {
    try {
      const response = await templateFetchService.getTemplates(database);
      res.json({ data: response, message: 'Templates fetched successfully' });
    } catch (err) {
      logger.error(String(`Error: Failed to get templates! ${err}`));
      res.json({ data: [], message: 'Error: Failed to get templates!' });
    }
  });

  router.put('/templates', async (req, res) => {
    try {
      const body = req.body;
      const response = await templateFetchService.updateTemplate(
        body,
        database,
      );
      res.json({ data: response, message: 'Template updated successfully' });
    } catch (err) {
      logger.error(String(`Error: Failed to update template! ${err}`));
      res.json({ data: [], message: 'Error: Failed to update template!' });
    }
  });

  router.delete('/templates/:id', async (req, res) => {
    try {
      const templateId = req.params.id;
      const response = await templateFetchService.deleteTemplate(
        templateId,
        database,
      );
      res.json({ data: response, message: 'Template deleted successfully' });
    } catch (err) {
      logger.error(String(`Error: Failed to delete template! ${err}`));
      res.json({ data: [], message: 'Error: Failed to delete template!' });
    }
  });

  return router;
}
