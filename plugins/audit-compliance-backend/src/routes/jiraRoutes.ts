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

  /**
   * POST /jira/comment
   * Adds a comment to an existing Jira ticket and updates the local database.
   *
   * @route POST /jira/comment
   * @param {Object} req.body - Request body containing id, comments, and ticket_reference
   * @returns {Object} 200 - Success message
   * @returns {Object} 500 - Error response
   */
  jiraRouter.post('/jira/comment', async (req, res) => {
    const { id, comments, ticket_reference } = req.body;

    try {
      await database.addJiraCommentAndUpdateDb(id, comments, ticket_reference);
      res.status(200).json({ message: 'Comment added successfully.' });
    } catch (err: any) {
      logger.error('Error adding Jira comment:', err.message);
      res.status(500).json({ error: err.message || 'Unknown error occurred.' });
    }
  });

  /**
   * POST /jira/service-account/comment
   * Adds a comment to an existing Jira ticket for a service account and updates the local database.
   *
   * @route POST /jira/service-account/comment
   * @param {Object} req.body - Request body containing id, comments, and ticket_reference
   * @returns {Object} 200 - Success message
   * @returns {Object} 500 - Error response
   */
  jiraRouter.post('/jira/service-account/comment', async (req, res) => {
    const { id, comments, ticket_reference } = req.body;

    try {
      await database.addServiceAccountJiraCommentAndUpdateDb(
        id,
        comments,
        ticket_reference,
      );
      res.status(200).json({ message: 'Comment added successfully.' });
    } catch (err: any) {
      logger.error('Error adding Jira comment (service account):', err.message);
      res.status(500).json({ error: err.message || 'Unknown error occurred.' });
    }
  });

  return jiraRouter;
}
