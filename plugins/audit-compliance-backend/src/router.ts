import express from 'express';
import {
  DatabaseService,
  LoggerService,
  RootConfigService,
} from '@backstage/backend-plugin-api';
import Router from 'express-promise-router';
import { AuditComplianceDatabase } from './database';
import { RoverDatabase } from './database/RoverInetgrations';

// Create and return the application router
export async function createRouter(
  databaseServer: DatabaseService,
  config: RootConfigService,
  logger: LoggerService,
): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  // Initialize AuditCompliance database
  const database = await AuditComplianceDatabase.create({
    knex: await databaseServer.getClient(),
    skipMigrations: false,
  });

  // Initialize Rover integrations database
  const roverStore = await RoverDatabase.create({
    knex: await databaseServer.getClient(),
    config,
    logger,
  });

  // ===== APPLICATIONS =====

  // GET all applications
  // Returns a list of all applications
  router.get('/applications', async (_req, res) => {
    const apps = await database.getAllApplications();
    res.json(apps);
  });

  // POST a new application
  // Takes the application details in the request body and inserts it into the database
  router.post('/applications', async (req, res) => {
    const newApp = req.body;
    const id = await database.insertApplication(newApp);
    res.status(201).json({ id });
  });

  // PUT update an existing application
  // Takes the application ID in the URL and the new details in the request body
  router.put('/applications/:id', async (req, res) => {
    const { id } = req.params;
    await database.updateApplication(Number(id), req.body);
    res.sendStatus(204);
  });

  // ===== ACCESS REVIEWS =====

  // GET access reviews for a specific application
  // Takes query parameters: app_name, frequency, and period
  router.get('/access-reviews', async (req, res) => {
    const { app_name, frequency, period } = req.query;

    if (!app_name || !frequency || !period) {
      return res.status(400).json({
        error: 'Missing required query parameters: app_name, frequency, period',
      });
    }

    try {
      const reviews = await database.getAccessReviews({
        app_name: app_name as string,
        frequency: frequency as string,
        period: period as string,
      });
      return res.json(reviews);
    } catch (error) {
      console.error('Failed to fetch access reviews:', error);
      return res.status(500).json({ error: 'Failed to fetch access reviews' });
    }
  });

  // POST update access reviews
  // Takes an array or object in the request body and updates the reviews
  router.post('/access-reviews', async (req, res) => {
    try {
      const payload = req.body;

      if (!payload || (Array.isArray(payload) && payload.length === 0)) {
        return res.status(400).json({ error: 'Payload is required' });
      }

      const dataArray = Array.isArray(payload) ? payload : [payload];
      const results = await database.updateAccessReview(dataArray);
      return res.status(200).json({ success: true, data: results });
    } catch (error) {
      console.error('Error updating access review data:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // ===== APPLICATION AUDITS =====

  // GET all audits
  // Returns a list of all application audits
  router.get('/audits', async (_req, res) => {
    const audits = await database.getAllAudits();
    res.json(audits);
  });

  // POST a new audit
  // Takes audit details in the request body and inserts it into the database
  router.post('/audits', async (req, res) => {
    const audit = req.body;
    const id = await database.insertAudit(audit);
    res.status(201).json({ id });
  });

  // PUT update an existing audit
  // Takes the audit ID in the URL and the new audit details in the request body
  router.put('/audits/:id', async (req, res) => {
    const { id } = req.params;
    await database.updateAudit(Number(id), req.body);
    res.sendStatus(204);
  });

  // POST check for duplicate audit
  // Checks if an audit already exists for the same app_name, frequency, and period
  router.post('/audits/check-duplicate', async (req, res) => {
    const { app_name, frequency, period } = req.body;
    const existingAudit = await database.findAuditByAppNamePeriod(
      app_name,
      frequency,
      period,
    );
    res.json({ duplicate: !!existingAudit });
  });

  // ===== SERVICE ACCOUNT ACCESS REVIEWS =====

  // GET service account access reviews
  // Takes query parameters: app_name, frequency, and period
  router.get('/service_account_access_review', async (req, res) => {
    const { app_name, frequency, period } = req.query;

    if (!app_name || !frequency || !period) {
      return res.status(400).json({
        error:
          'Missing required query parameters: app_name, frequency, and period',
      });
    }

    try {
      const reviews = await database.getServiceAccountAccessReviews({
        app_name: app_name as string,
        frequency: frequency as string,
        period: period as string,
      });
      return res.json(reviews);
    } catch (error) {
      console.error('Failed to fetch access reviews:', error);
      return res.status(500).json({ error: 'Failed to fetch access reviews' });
    }
  });

  // POST update service account access review
  // Takes an array or object in the request body and updates the service account access review data
  router.post('/service_account_access_review', async (req, res) => {
    const payload = req.body;
    console.log('service_account_access_review', payload);

    try {
      if (!payload || (Array.isArray(payload) && payload.length === 0)) {
        return res.status(400).json({ error: 'No data provided' });
      }

      console.log({ payload });
      const result = await database.updateServiceAccountAccessReviewData(
        payload,
      );
      return res.json(result);
    } catch (error) {
      console.error('Failed to update service account access review:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ===== ROVER REPORT =====
  // POST generate rover report
  // Takes appname, frequency, and period in the request body and generates a report
  router.post('/rover-report', async (req, res) => {
    const { appname, frequency, period } = req.body;

    // Check if the required fields are provided in the request
    if (!appname || !frequency || !period) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
      // Generate rover data
      const report = await roverStore.generateRoverData(
        appname,
        frequency,
        period,
      );

      // Send success response with generated report
      return res.status(200).json({
        message: 'Report generated successfully',
        data: report,
        frequency,
        period,
      });
    } catch (error) {
      console.error(`Error generating rover data: ${error}`);
      return res.status(500).json({ error: 'Failed to generate report' });
    }
  });

  return router;
}
