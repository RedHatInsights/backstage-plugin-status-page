import { HttpAuthService } from '@backstage/backend-plugin-api';
import express from 'express';
import Router from 'express-promise-router';
import { IncidentService, PostmortemService } from './services';

export async function createRouter({
  incidentFetchService,
  postmortemFetchService
}: {
  httpAuth: HttpAuthService;
  incidentFetchService: IncidentService;
  postmortemFetchService: PostmortemService;
}): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  router.get('/incidents', async (_req, res) => {
    const response = await incidentFetchService.getIncidents();
    res.json({ data: response });
  });

  router.get('/incidents/:id', async (req, res) => {
    const incidentId = req.params.id;
    const response = await incidentFetchService.getIncidentsById(incidentId);
    res.json({ data: response });
  });

  router.get('/components', async (_req, res) => {
    const response = await incidentFetchService.getComponents();
    res.json({ data: response });
  });

  router.post('/incidents', async (req, res) => {
    try {
      const body = req.body.incident;
      const response = await incidentFetchService.createIncident(body);
      res.json({ data: response });
    } catch (err) {
      res.json({ data: [], message: 'Error: Failed to create incident!' });
    }
  });

  router.patch('/incidents/:id', async (req, res) => {
    try {
      const incidentId = req.body.id;
      const body = req.body.incident;
      const response = await incidentFetchService.updateIncident(
        incidentId,
        body,
      );
      res.json({ data: response });
    } catch (err) {
      res.json({ data: [], message: 'Error: Failed to create incident!' });
    }
  });

  router.delete('/incidents/:id', async (req, res) => {
    try {
      const incidentId = req.params.id;
      const response = await incidentFetchService.deleteIncident(incidentId);
      res.json({ data: response });
    } catch (err) {
      res.json({ data: [], message: 'Error: Failed to create incident!' });
    }
  });
  router.get('/health', (_, res) => res.json({ status: 'ok' }));

  router.post('/postmortem/:id/draft', async (req, res) => {
    try {
      const incidentId = req.params.id;
      const body = req.body;
      const response = await postmortemFetchService.draftPostmortem(incidentId, body);
      res.json({ data: response });
    } catch (err) {
      res.json({ data: [], message: 'Error: Failed to create incident!' });
    }
  });

  router.post('/postmortem/:id/publish', async (req, res) => {
    try {
      const incidentId = req.params.id;
      const body = req.body;
      const response = await postmortemFetchService.publishPostmortem(incidentId, body);
      res.json({ data: response });
    } catch (err) {
      res.json({ data: [], message: 'Error: Failed to create incident!' });
    }
  });

  return router;
}
