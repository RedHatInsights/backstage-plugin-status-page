import { Knex } from 'knex';
import express from 'express';
import Router from 'express-promise-router';
import { AuditComplianceDatabase } from '../database/AuditComplianceDatabase';

/**
 * Creates the plugin router with all endpoint definitions.
 * @param knex - The Knex client
 * @param logger - The logger service
 * @param config - The configuration service
 * @returns An Express router instance with all routes
 */
export async function createJiraRouter(
  knex: Knex,
  logger: any,
  config: any,
): Promise<express.Router> {
  const database = await AuditComplianceDatabase.create({
    knex,
    skipMigrations: true,
    logger,
    config,
  });

  const jiraRouter = Router();

  /**
   * POST /create-aqr-ticket
   * Creates a Jira ticket for an access review and updates its status.
   *
   * @route POST /create-aqr-ticket
   * @param {Object} req.body - Request body containing ticket details
   * @returns {Object} 201 - Created ticket information
   * @returns {Object} 500 - Error response
   */
  jiraRouter.post('/create-aqr-ticket', async (req, res) => {
    try {
      const result = await database.createAqrJiraTicketAndUpdateStatus(
        req.body,
      );

      res.status(201).json({
        message: 'Jira ticket created and status updated.',
        ...result,
      });
    } catch (err: any) {
      logger.error('AQR ticket error:', err.message);
      res.status(500).json({ error: err.message || 'Unknown error occurred.' });
    }
  });

  /**
   * POST /create-service-account-ticket
   * Creates a Jira ticket for a service account access review and updates its status.
   *
   * @route POST /create-service-account-ticket
   * @param {Object} req.body - Request body containing ticket details
   * @returns {Object} 201 - Created ticket information
   * @returns {Object} 500 - Error response
   */
  jiraRouter.post('/create-service-account-ticket', async (req, res) => {
    try {
      // Map frontend parameters to backend function parameters
      const { user_id, app_name, ...rest } = req.body;
      const mappedData = {
        service_account: user_id,
        appName: app_name,
        ...rest,
      };

      const result = await database.createServiceAccountJiraTicket(mappedData);

      res.status(201).json({
        message: 'Service account Jira ticket created and status updated.',
        ...result,
      });
    } catch (err: any) {
      logger.error('Service account ticket error:', err.message);
      res.status(500).json({ error: err.message || 'Unknown error occurred.' });
    }
  });

  return jiraRouter;
}
