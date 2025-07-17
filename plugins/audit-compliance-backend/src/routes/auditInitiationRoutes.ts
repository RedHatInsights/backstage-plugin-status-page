import { Knex } from 'knex';
import express from 'express';
import Router from 'express-promise-router';
import { AuditComplianceDatabase } from '../database/AuditComplianceDatabase';
import { RoverDatabase } from '../database/RoverIntegration';
import { GitLabDatabase } from '../database/GitLabIntegration';

/**
 * Creates the plugin router with all endpoint definitions.
 * @param knex - The Knex client
 * @param config - The root config service
 * @param logger - The logger service
 * @returns An Express router instance with all routes
 */
export async function createAuditInitiationRouter(
  knex: Knex,
  config: any,
  logger: any,
): Promise<express.Router> {
  const database = await AuditComplianceDatabase.create({
    knex,
    skipMigrations: true,
    logger,
    config,
  });

  const auditInitiationRouter = Router();

  // Initialize Rover integrations database
  const roverStore = await RoverDatabase.create({
    knex,
    config,
    logger,
    skipMigrations: true,
  });

  // Initialize GitLab integrations database
  const gitlabStore = await GitLabDatabase.create({
    knex,
    config,
    logger,
  });

  /**
   * GET /search/groups
   * Searches for Rover groups by partial or full name.
   * @route GET /search/groups
   * @query {string} q - Search string for group name
   * @returns {Array} 200 - List of matching groups
   * @returns {Object} 400 - Missing query parameter
   * @returns {Object} 500 - Error response
   */
  auditInitiationRouter.get('/search/groups', async (req, res) => {
    const q = req.query.q as string;
    if (!q) {
      return res
        .status(400)
        .json({ error: 'Missing required query parameter: q' });
    }
    try {
      const groups = await roverStore.searchGroups(q);
      // Return only the CNs as an array of strings
      const groupCns = Array.isArray(groups)
        ? groups.map(g => g.cn).filter(Boolean)
        : [];
      return res.json(groupCns);
    } catch (error) {
      logger.error('Failed to search groups', { error: String(error) });
      return res.status(500).json({ error: 'Failed to search groups' });
    }
  });

  /**
   * GET /audits
   * Retrieves all application audits.
   * Optionally filters by app_name, frequency, and period.
   *
   * @route GET /audits
   * @query {string} [app_name] - Application name to filter by
   * @query {string} [frequency] - Audit frequency to filter by
   * @query {string} [period] - Audit period to filter by
   * @returns {Array} 200 - List of audits
   * @returns {Object} 500 - Error response
   */
  auditInitiationRouter.get('/audits', async (req, res) => {
    const { app_name, frequency, period } = req.query;
    const audits = await database.getAllAudits({
      app_name: app_name as string,
      frequency: frequency as string,
      period: period as string,
    });
    res.json(audits);
  });

  /**
   * POST /audits
   * Creates a new audit and generates associated reports.
   *
   * @route POST /audits
   * @param {Object} req.body - Audit details
   * @returns {Object} 200 - Created audit information
   * @returns {Object} 500 - Error response
   */
  auditInitiationRouter.post('/audits', async (req, res) => {
    try {
      const audit = req.body;
      const db = await knex;

      // First clear any existing data for this app/period combination
      await db('group_access_reports')
        .where({
          app_name: audit.app_name,
          frequency: audit.frequency,
          period: audit.period,
        })
        .delete();
      await db('service_account_access_review')
        .where({
          app_name: audit.app_name,
          frequency: audit.frequency,
          period: audit.period,
        })
        .delete();

      // Insert the audit record
      const id = await database.insertAudit(audit);

      // Create activity stream event for audit initiation
      await database.createActivityEvent({
        event_type: 'AUDIT_INITIATED',
        app_name: audit.app_name,
        frequency: audit.frequency,
        period: audit.period,
        performed_by: 'system',
        metadata: {
          audit_id: id,
          jira_key: null,
        },
      });

      // Get application details
      const appDetails = await database.getApplicationDetails(audit.app_name);

      if (!appDetails) {
        throw new Error(`Application details not found for ${audit.app_name}`);
      }

      // Generate reports from both sources
      const reportPromises = [
        // Generate Rover report
        roverStore
          .generateRoverData(audit.app_name, audit.frequency, audit.period)
          .catch(error => {
            logger.error('Failed to generate Rover report', { error });
            return null;
          }),
        // Generate GitLab report
        gitlabStore
          .generateGitLabData(audit.app_name, audit.frequency, audit.period)
          .catch(error => {
            logger.error('Failed to generate GitLab report', { error });
            return null;
          }),
      ];

      // Wait for all report generations to complete
      const reportResults = await Promise.all(reportPromises);
      const successfulReports = reportResults.filter(result => result !== null);

      // Try to create Jira ticket for the audit (as an Epic)
      let jiraTicket = null;
      let jiraCreationFailed = false;
      try {
        jiraTicket = await database.createAuditJiraTicket({
          app_name: audit.app_name,
          frequency: audit.frequency,
          period: audit.period,
        });
        // Update the audit record with the Jira ticket key
        await database.updateAudit(
          audit.app_name,
          audit.frequency,
          audit.period,
          {
            jira_key: jiraTicket.key,
            jira_status: jiraTicket.status,
          },
        );
      } catch (jiraError) {
        logger.error('Failed to create JIRA epic', {
          error:
            jiraError instanceof Error ? jiraError.message : String(jiraError),
        });
        jiraCreationFailed = true;
        // Update the audit record with jira_key: 'N/A'
        await database.updateAudit(
          audit.app_name,
          audit.frequency,
          audit.period,
          {
            jira_key: 'N/A',
            jira_status: 'N/A',
          },
        );
      }

      // Set progress to 'details_under_review' after data is fetched and JIRA is handled
      await database.updateAuditProgress(
        audit.app_name,
        audit.frequency,
        audit.period,
        'details_under_review',
      );

      return res.json({
        id: id.id,
        message: 'Audit initiated successfully',
        reports_generated: successfulReports.length,
        jira_creation_failed: jiraCreationFailed,
        jira_ticket: jiraTicket,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error('Failed to initiate audit', { error: errorMessage });
      return res.status(500).json({ error: 'Failed to initiate audit' });
    }
  });

  /**
   * PUT /audits/:app_name/:frequency/:period
   * Updates an existing audit record.
   *
   * @route PUT /audits/:app_name/:frequency/:period
   * @param {string} req.params.app_name - Application name
   * @param {string} req.params.frequency - Audit frequency
   * @param {string} req.params.period - Audit period
   * @param {Object} req.body - Updated audit details
   * @returns {void} 204 - Success response
   * @returns {Object} 500 - Error response
   */
  auditInitiationRouter.put(
    '/audits/:app_name/:frequency/:period',
    async (req, res) => {
      const { app_name, frequency, period } = req.params;
      try {
        await database.updateAudit(app_name, frequency, period, req.body);
        res.sendStatus(204);
      } catch (error) {
        logger.error('Failed to update audit', {
          error: error instanceof Error ? error.message : String(error),
          app_name,
          frequency,
          period,
        });
        res.status(500).json({
          error: 'Failed to update audit',
          message: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  /**
   * PUT /audits/:app_name/:frequency/:period/jira-key
   * Allows the application owner to manually update the Jira Epic key for an audit.
   * @route PUT /audits/:app_name/:frequency/:period/jira-key
   * @param {string} req.params.app_name - Application name
   * @param {string} req.params.frequency - Audit frequency
   * @param {string} req.params.period - Audit period
   * @param {Object} req.body - { jira_key: string }
   * @returns {void} 204 - Success response
   * @returns {Object} 403 - Forbidden
   * @returns {Object} 404 - Audit not found
   * @returns {Object} 500 - Error response
   */
  auditInitiationRouter.put(
    '/audits/:app_name/:frequency/:period/jira-key',
    async (req, res) => {
      const { app_name, frequency, period } = req.params;
      const { jira_key, user } = req.body;
      try {
        // Fetch the audit and application details
        const audit = await database.findAuditByAppNamePeriod(
          app_name,
          frequency,
          period,
        );
        const appDetails = await database.getApplicationDetails(app_name);
        if (!audit || !appDetails) {
          return res
            .status(404)
            .json({ error: 'Audit or application not found' });
        }
        // Check if the user is the application owner (compare username part)
        let userName = '';
        if (user && typeof user === 'string') {
          if (user.includes('@')) {
            userName = user.split('@')[0] || '';
          } else {
            userName = user.split('/').pop() || '';
          }
        }
        let ownerName = '';
        if (
          appDetails.app_owner_email &&
          typeof appDetails.app_owner_email === 'string'
        ) {
          ownerName = appDetails.app_owner_email.split('@')[0] || '';
        } else if (
          appDetails.app_owner &&
          typeof appDetails.app_owner === 'string'
        ) {
          ownerName = appDetails.app_owner.split('@')[0] || '';
        }
        if (!user || !userName || !ownerName || userName !== ownerName) {
          return res.status(403).json({
            error: 'Only the application owner can update the Jira Epic key.',
          });
        }
        await database.updateAudit(app_name, frequency, period, { jira_key });
        return res.sendStatus(204);
      } catch (error) {
        logger.error('Failed to update Jira Epic key', {
          error: error instanceof Error ? error.message : String(error),
          app_name,
          frequency,
          period,
        });
        return res
          .status(500)
          .json({ error: 'Failed to update Jira Epic key' });
      }
    },
  );

  /**
   * POST /audits/check-duplicate
   * Checks if an audit already exists for the given parameters.
   *
   * @route POST /audits/check-duplicate
   * @param {Object} req.body - Audit parameters to check
   * @returns {Object} 200 - Duplicate check result
   * @returns {Object} 500 - Error response
   */
  auditInitiationRouter.post('/audits/check-duplicate', async (req, res) => {
    const { app_name, frequency, period } = req.body;
    const existingAudit = await database.findAuditByAppNamePeriod(
      app_name,
      frequency,
      period,
    );
    res.json({ duplicate: !!existingAudit });
  });

  /**
   * PUT /audits/progress
   * Updates the progress status of an audit.
   *
   * @route PUT /audits/progress
   * @param {Object} req.body - Audit parameters and progress
   * @returns {Object} 200 - Success response
   * @returns {Object} 400 - Invalid parameters or progress
   * @returns {Object} 500 - Error response
   */
  auditInitiationRouter.put('/audits/progress', async (req, res) => {
    const { app_name, frequency, period, progress, performed_by } = req.body;

    if (!app_name || !frequency || !period || !progress) {
      res.status(400).json({
        error: 'app_name, frequency, period, and progress are required',
      });
      return;
    }

    // Validate progress value
    const validProgressStates = [
      'audit_started',
      'details_under_review',
      'final_sign_off_done',
      'summary_generated',
      'completed',
    ];

    if (!validProgressStates.includes(progress)) {
      res.status(400).json({
        error: `Invalid progress value. Must be one of: ${validProgressStates.join(
          ', ',
        )}`,
      });
      return;
    }

    try {
      await database.updateAuditProgress(
        app_name,
        frequency,
        period,
        progress,
        performed_by || 'system',
      );
      res.json({ message: 'Progress updated successfully' });
    } catch (error) {
      res.status(500).json({
        error:
          error instanceof Error ? error.message : 'Failed to update progress',
      });
    }
  });
  return auditInitiationRouter;
}
