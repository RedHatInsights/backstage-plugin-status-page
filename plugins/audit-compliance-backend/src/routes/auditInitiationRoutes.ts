import { Knex } from 'knex';
import express from 'express';
import Router from 'express-promise-router';
import { AuditComplianceDatabase } from '../database/AuditComplianceDatabase';
import { RoverDatabase } from '../database/integrations/RoverIntegration';
import { GitLabDatabase } from '../database/integrations/GitLabIntegration';
import { ManualDataIntegration } from '../database/integrations/ManualDataIntegration';
import { EventType } from '../database/operations/operations.types';

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

  // Initialize Manual integrations database
  const manualStore = new ManualDataIntegration(knex, logger);

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

      // Generate reports from all sources
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
        // Generate LDAP report
        roverStore
          .generateLDAPData(audit.app_name, audit.frequency, audit.period)
          .catch(error => {
            logger.error('Failed to generate LDAP report', { error });
            return null;
          }),
        // Generate Manual report
        manualStore
          .generateManualData(audit.app_name, audit.frequency, audit.period)
          .catch(error => {
            logger.error('Failed to generate Manual report', { error });
            return null;
          }),
      ];

      // Wait for all report generations to complete
      const reportResults = await Promise.all(reportPromises);
      const successfulReports = reportResults.filter(result => result !== null);

      // Try to create Jira ticket for the audit (as a Story)
      let jiraTicket = null;
      let jiraCreationFailed = false;
      try {
        jiraTicket = await database.createAuditJiraTicket(
          {
            app_name: audit.app_name,
            frequency: audit.frequency,
            period: audit.period,
          },
          undefined,
          audit.initiated_by || 'system',
        );
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
        logger.error('Failed to create JIRA story', {
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
        epic_details: jiraTicket
          ? {
              epic_key: jiraTicket.epic_key,
              epic_title: jiraTicket.epic_title,
              epic_creation_failed: jiraTicket.epic_creation_failed,
            }
          : null,
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
   * Allows the application owner to manually update the Jira Story key and Epic key for an audit.
   * @route PUT /audits/:app_name/:frequency/:period/jira-key
   * @param {string} req.params.app_name - Application name
   * @param {string} req.params.frequency - Audit frequency
   * @param {string} req.params.period - Audit period
   * @param {Object} req.body - { jira_key: string, epic_key: string, user: string }
   * @returns {void} 204 - Success response
   * @returns {Object} 403 - Forbidden
   * @returns {Object} 404 - Audit not found
   * @returns {Object} 500 - Error response
   */
  auditInitiationRouter.put(
    '/audits/:app_name/:frequency/:period/jira-key',
    async (req, res) => {
      const { app_name, frequency, period } = req.params;
      const { jira_key, epic_key, user } = req.body;
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
            error:
              'Only the application owner can update the Jira Story and Epic keys.',
          });
        }

        // Prepare update data - only include fields that are provided
        const updateData: any = {};
        if (jira_key !== undefined) updateData.jira_key = jira_key;
        if (epic_key !== undefined) updateData.epic_key = epic_key;

        await database.updateAudit(app_name, frequency, period, updateData);

        // If epic_key was updated, sync it to Jira Story
        if (epic_key !== undefined && epic_key.trim() !== '') {
          try {
            const syncResult = await database.syncEpicToStory(
              app_name,
              frequency,
              period,
              epic_key,
            );

            if (!syncResult.success) {
              logger.warn('Epic sync to Story failed', {
                app_name,
                frequency,
                period,
                epic_key,
                error: syncResult.message,
              });
              // Don't fail the entire request, just log the warning
            } else {
              logger.info('Epic sync to Story successful', {
                app_name,
                frequency,
                period,
                epic_key,
              });
            }
          } catch (syncError) {
            logger.error('Epic sync to Story error', {
              app_name,
              frequency,
              period,
              epic_key,
              error:
                syncError instanceof Error
                  ? syncError.message
                  : String(syncError),
            });
            // Don't fail the entire request, just log the error
          }
        }

        return res.sendStatus(204);
      } catch (error) {
        logger.error('Failed to update Jira Story and Epic keys', {
          error: error instanceof Error ? error.message : String(error),
          app_name,
          frequency,
          period,
        });
        return res
          .status(500)
          .json({ error: 'Failed to update Jira Story and Epic keys' });
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

  /**
   * POST /audits/refresh-data
   * Refreshes data for an existing audit without creating a new audit record.
   * Bypasses duplicate checks and only refreshes the data sources.
   *
   * @route POST /audits/refresh-data
   * @param {Object} req.body - Audit parameters
   * @returns {Object} 200 - Refresh results with statistics
   * @returns {Object} 400 - Missing parameters error
   * @returns {Object} 500 - Error response
   */
  auditInitiationRouter.post('/audits/refresh-data', async (req, res) => {
    const { app_name, frequency, period } = req.body;

    if (!app_name || !frequency || !period) {
      return res.status(400).json({
        error: 'Missing required parameters: app_name, frequency, period',
      });
    }

    try {
      // First, delete all existing data for this app/frequency/period combination
      const deletionResult = await database.deleteAuditData(
        app_name,
        frequency,
        period,
      );
      logger.info(
        `Deleted existing audit data for ${app_name}/${frequency}/${period}`,
      );

      // Generate reports from all sources (same as audit initiation but without creating audit record)
      logger.info('Starting refresh data generation for sources:', {
        app_name,
        frequency,
        period,
      });

      // Check what applications exist for this app_name
      const applications = await knex('applications')
        .select('source', 'type', 'account_name')
        .where('app_name', app_name);

      logger.info('Found applications for refresh:', {
        app_name,
        totalApplications: applications.length,
        applications: applications.map(app => ({
          source: app.source,
          type: app.type,
          account_name: app.account_name,
        })),
      });

      const reportPromises = [
        // Generate Rover report
        roverStore
          .generateRoverData(app_name, frequency, period)
          .catch(error => {
            logger.error('Failed to generate Rover report', { error });
            return null;
          }),
        // Generate GitLab report
        gitlabStore
          .generateGitLabData(app_name, frequency, period)
          .catch(error => {
            logger.error('Failed to generate GitLab report', {
              error: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
            });
            return null;
          }),
        // Generate LDAP report
        roverStore
          .generateLDAPData(app_name, frequency, period)
          .catch(error => {
            logger.error('Failed to generate LDAP report', { error });
            return null;
          }),
        // Generate Manual report
        manualStore
          .generateManualData(app_name, frequency, period)
          .catch(error => {
            logger.error('Failed to generate Manual report', { error });
            return null;
          }),
      ];

      // Wait for all report generations to complete
      const reportResults = await Promise.all(reportPromises);
      const successfulReports = reportResults.filter(result => result !== null);

      // Calculate statistics
      const roverCount = reportResults[0]?.length || 0;
      const gitlabCount = reportResults[1]?.length || 0;
      const ldapCount = reportResults[2]?.length || 0;
      const manualCount = reportResults[3]?.length || 0;
      const totalRecords = roverCount + gitlabCount + ldapCount + manualCount;

      // Add detailed logging for debugging
      logger.info('Refresh data results:', {
        app_name,
        frequency,
        period,
        roverCount,
        gitlabCount,
        ldapCount,
        manualCount,
        totalRecords,
        roverData: reportResults[0]
          ? `${reportResults[0].length} records`
          : 'null',
        gitlabData: reportResults[1]
          ? `${reportResults[1].length} records`
          : 'null',
        ldapData: reportResults[2]
          ? `${reportResults[2].length} records`
          : 'null',
        manualData: reportResults[3]
          ? `${reportResults[3].length} records`
          : 'null',
      });

      // Log GitLab data details if available
      if (reportResults[1] && reportResults[1].length > 0) {
        const gitlabData = reportResults[1];
        const serviceAccounts = gitlabData.filter(item => item.service_account);
        const userAccounts = gitlabData.filter(item => item.user_id);

        logger.info('GitLab data breakdown:', {
          total: gitlabData.length,
          serviceAccounts: serviceAccounts.length,
          userAccounts: userAccounts.length,
          serviceAccountDetails: serviceAccounts.map(sa => ({
            service_account: sa.service_account,
            app_name: sa.app_name,
            source: sa.source,
          })),
          userAccountDetails: userAccounts.map(ua => ({
            user_id: ua.user_id,
            app_name: ua.app_name,
            source: ua.source,
          })),
        });
      }

      const sources = [];
      if (roverCount > 0) sources.push('Rover');
      if (gitlabCount > 0) sources.push('GitLab');
      if (ldapCount > 0) sources.push('LDAP');
      if (manualCount > 0) sources.push('Manual');

      // Reset audit status to 'details_under_review' after data refresh
      // This allows users to continue working on the audit after refreshing data
      try {
        // Reset both progress and status to initial state
        await database.updateAudit(app_name, frequency, period, {
          progress: 'details_under_review',
          status: 'in_progress',
          updated_at: new Date(),
        });
        logger.info(
          `Reset audit status to initial state for ${app_name}/${frequency}/${period}`,
        );
      } catch (error) {
        logger.warn(
          `Failed to reset audit status after data refresh: ${error}`,
        );
        // Don't fail the entire refresh operation if status reset fails
      }

      // Create activity stream event for data refresh
      await database.createActivityEvent({
        event_type: 'AUDIT_DATA_REFRESHED' as EventType,
        app_name,
        frequency,
        period,
        performed_by: req.body.performed_by || 'system',
        metadata: {
          previous_status: 'data_refreshed',
          new_status: 'data_refreshed',
          reason: `Data refreshed: ${totalRecords} total records from ${sources.join(
            ', ',
          )}. Audit status reset to 'details_under_review' to allow continued work.`,
          deletion_stats: {
            group_access_deleted: deletionResult.groupAccessDeleted,
            service_accounts_deleted: deletionResult.serviceAccountsDeleted,
          },
          refresh_stats: {
            rover_records: roverCount,
            gitlab_records: gitlabCount,
            ldap_records: ldapCount,
            manual_records: manualCount,
            total_records: totalRecords,
            sources: sources,
          },
        },
      });

      return res.json({
        message: 'Audit data refreshed successfully',
        reports_generated: successfulReports.length,
        total_records: totalRecords,
        sources: sources,
        statistics: {
          rover: { total: roverCount },
          gitlab: { total: gitlabCount },
          ldap: { total: ldapCount },
          manual: { total: manualCount },
        },
      });
    } catch (error) {
      logger.error('Failed to refresh audit data', {
        error: error instanceof Error ? error.message : String(error),
        app_name,
        frequency,
        period,
      });
      return res.status(500).json({
        error: 'Failed to refresh audit data',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  return auditInitiationRouter;
}
