import { Knex } from 'knex';
import express from 'express';
import Router from 'express-promise-router';
import { AuditComplianceDatabase } from '../database/AuditComplianceDatabase';

/**
 * Creates the plugin router with all endpoint definitions.
 * @param knex - The shared Knex client
 * @param logger - The logger service
 * @param config - The configuration service
 * @returns An Express router instance with all routes
 */
export async function createAuditSummaryRouter(
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

  const auditSummaryRouter = Router();

  /**
   * POST /generate-summary
   * Generates a summary for an audit and creates associated event.
   *
   * @route POST /generate-summary
   * @param {Object} req.body - Summary generation parameters
   * @returns {Object} 200 - Summary generation result
   * @returns {Object} 400 - Missing parameters error
   * @returns {Object} 500 - Error response
   */
  auditSummaryRouter.post('/generate-summary', async (req, res) => {
    const { app_name, frequency, period, performed_by } = req.body;

    if (!app_name || !frequency || !period || !performed_by) {
      return res.status(400).json({
        error:
          'Missing required fields: app_name, frequency, period, performed_by',
      });
    }

    try {
      // Get the audit record
      const audit = await database.findAuditByAppNamePeriod(
        app_name,
        frequency,
        period,
      );

      if (!audit) {
        return res.status(404).json({ error: 'Audit not found' });
      }

      // Create the summary generated event
      await database.createActivityEvent({
        event_type: 'AUDIT_SUMMARY_GENERATED',
        app_name,
        frequency,
        period,
        performed_by,
        metadata: {
          audit_id: audit.id,
          jira_key: audit.jira_key,
        },
      });

      return res.status(200).json({
        message: 'Summary generated successfully',
        audit_id: audit.id,
      });
    } catch (error) {
      logger.error('Failed to generate summary', {
        error: error instanceof Error ? error.message : String(error),
      });
      return res.status(500).json({ error: 'Failed to generate summary' });
    }
  });
  /**
   * GET /audits/:app_name/:frequency/:period/statistics
   * Generates statistics for the summary page of an audit.
   *
   * @route GET /audits/:app_name/:frequency/:period/statistics
   * @param {string} req.params.app_name - Application name
   * @param {string} req.params.frequency - Review frequency
   * @param {string} req.params.period - Review period
   * @returns {Object} 200 - Audit statistics
   * @returns {Object} 500 - Error response
   */
  auditSummaryRouter.get(
    '/audits/:app_name/:frequency/:period/statistics',
    async (req, res) => {
      const { app_name, frequency, period } = req.params;

      try {
        const db = knex;

        // Get data from both regular and fresh tables
        const [
          regularGroupAccess,
          freshGroupAccess,
          regularServiceAccounts,
          freshServiceAccounts,
        ] = await Promise.all([
          // Regular group access reports
          db('group_access_reports')
            .where({ app_name, frequency, period })
            .select('*'),
          // Fresh group access reports
          db('group_access_reports_fresh')
            .where({ app_name, frequency, period })
            .select('*'),
          // Regular service account access reviews
          db('service_account_access_review')
            .where({ app_name, frequency, period })
            .select('*'),
          // Fresh service account access reviews
          db('service_account_access_review_fresh')
            .where({ app_name, frequency, period })
            .select('*'),
        ]);

        // Calculate statistics for group access by source
        const groupAccessStats = {
          rover: {
            total: regularGroupAccess.filter(r => r.source === 'rover').length,
            fresh: freshGroupAccess.filter(r => r.source === 'rover').length,
            approved: regularGroupAccess.filter(
              r => r.source === 'rover' && r.sign_off_status === 'approved',
            ).length,
            rejected: regularGroupAccess.filter(
              r => r.source === 'rover' && r.sign_off_status === 'rejected',
            ).length,
            pending: regularGroupAccess.filter(
              r =>
                r.source === 'rover' &&
                (!r.sign_off_status || r.sign_off_status === 'pending'),
            ).length,
            changes: {
              added: freshGroupAccess.filter(
                fresh =>
                  fresh.source === 'rover' &&
                  !regularGroupAccess.some(
                    reg => reg.user_id === fresh.user_id,
                  ),
              ).length,
              removed: regularGroupAccess.filter(
                reg =>
                  reg.source === 'rover' &&
                  !freshGroupAccess.some(
                    fresh => fresh.user_id === reg.user_id,
                  ),
              ).length,
              modified: regularGroupAccess.filter(reg => {
                if (reg.source !== 'rover') return false;
                const fresh = freshGroupAccess.find(
                  f => f.user_id === reg.user_id,
                );
                return (
                  fresh &&
                  (fresh.user_role !== reg.user_role ||
                    fresh.manager !== reg.manager ||
                    fresh.app_delegate !== reg.app_delegate)
                );
              }).length,
            },
          },
          gitlab: {
            total: regularGroupAccess.filter(r => r.source === 'gitlab').length,
            fresh: freshGroupAccess.filter(r => r.source === 'gitlab').length,
            approved: regularGroupAccess.filter(
              r =>
                r.source === 'gitlab' &&
                r.sign_off_status?.toLowerCase() === 'approved',
            ).length,
            rejected: regularGroupAccess.filter(
              r =>
                r.source === 'gitlab' &&
                r.sign_off_status?.toLowerCase() === 'rejected',
            ).length,
            pending: regularGroupAccess.filter(
              r =>
                r.source === 'gitlab' &&
                (!r.sign_off_status ||
                  r.sign_off_status?.toLowerCase() === 'pending'),
            ).length,
            changes: {
              added: freshGroupAccess.filter(
                fresh =>
                  fresh.source === 'gitlab' &&
                  !regularGroupAccess.some(
                    reg => reg.user_id === fresh.user_id,
                  ),
              ).length,
              removed: regularGroupAccess.filter(
                reg =>
                  reg.source === 'gitlab' &&
                  !freshGroupAccess.some(
                    fresh => fresh.user_id === reg.user_id,
                  ),
              ).length,
              modified: regularGroupAccess.filter(reg => {
                if (reg.source !== 'gitlab') return false;
                const fresh = freshGroupAccess.find(
                  f => f.user_id === reg.user_id,
                );
                return (
                  fresh &&
                  (fresh.user_role !== reg.user_role ||
                    fresh.manager !== reg.manager ||
                    fresh.app_delegate !== reg.app_delegate)
                );
              }).length,
            },
          },
          ldap: {
            total: regularGroupAccess.filter(r => r.source === 'ldap').length,
            fresh: freshGroupAccess.filter(r => r.source === 'ldap').length,
            approved: regularGroupAccess.filter(
              r =>
                r.source === 'ldap' &&
                r.sign_off_status?.toLowerCase() === 'approved',
            ).length,
            rejected: regularGroupAccess.filter(
              r =>
                r.source === 'ldap' &&
                r.sign_off_status?.toLowerCase() === 'rejected',
            ).length,
            pending: regularGroupAccess.filter(
              r =>
                r.source === 'ldap' &&
                (!r.sign_off_status ||
                  r.sign_off_status?.toLowerCase() === 'pending'),
            ).length,
            changes: {
              added: freshGroupAccess.filter(
                fresh =>
                  fresh.source === 'ldap' &&
                  !regularGroupAccess.some(
                    reg => reg.user_id === fresh.user_id,
                  ),
              ).length,
              removed: regularGroupAccess.filter(
                reg =>
                  reg.source === 'ldap' &&
                  !freshGroupAccess.some(
                    fresh => fresh.user_id === reg.user_id,
                  ),
              ).length,
              modified: regularGroupAccess.filter(reg => {
                if (reg.source !== 'ldap') return false;
                const fresh = freshGroupAccess.find(
                  f => f.user_id === reg.user_id,
                );
                return (
                  fresh &&
                  (fresh.user_role !== reg.user_role ||
                    fresh.manager !== reg.manager ||
                    fresh.app_delegate !== reg.app_delegate)
                );
              }).length,
            },
          },
        };

        // Calculate statistics for service accounts by source
        const serviceAccountStats = {
          rover: {
            total: regularServiceAccounts.filter(r => r.source === 'rover')
              .length,
            fresh: freshServiceAccounts.filter(r => r.source === 'rover')
              .length,
            approved: regularServiceAccounts.filter(
              r =>
                r.source === 'rover' &&
                r.sign_off_status?.toLowerCase() === 'approved',
            ).length,
            rejected: regularServiceAccounts.filter(
              r =>
                r.source === 'rover' &&
                r.sign_off_status?.toLowerCase() === 'rejected',
            ).length,
            pending: regularServiceAccounts.filter(
              r =>
                r.source === 'rover' &&
                (!r.sign_off_status ||
                  r.sign_off_status?.toLowerCase() === 'pending'),
            ).length,
            changes: {
              added: freshServiceAccounts.filter(
                fresh =>
                  fresh.source === 'rover' &&
                  !regularServiceAccounts.some(
                    reg => reg.service_account === fresh.service_account,
                  ),
              ).length,
              removed: regularServiceAccounts.filter(
                reg =>
                  reg.source === 'rover' &&
                  !freshServiceAccounts.some(
                    fresh => fresh.service_account === reg.service_account,
                  ),
              ).length,
              modified: regularServiceAccounts.filter(reg => {
                if (reg.source !== 'rover') return false;
                const fresh = freshServiceAccounts.find(
                  f => f.service_account === reg.service_account,
                );
                return (
                  fresh &&
                  (fresh.user_role !== reg.user_role ||
                    fresh.manager !== reg.manager ||
                    fresh.app_delegate !== reg.app_delegate)
                );
              }).length,
            },
          },
          gitlab: {
            total: regularServiceAccounts.filter(r => r.source === 'gitlab')
              .length,
            fresh: freshServiceAccounts.filter(r => r.source === 'gitlab')
              .length,
            approved: regularServiceAccounts.filter(
              r =>
                r.source === 'gitlab' &&
                r.sign_off_status?.toLowerCase() === 'approved',
            ).length,
            rejected: regularServiceAccounts.filter(
              r =>
                r.source === 'gitlab' &&
                r.sign_off_status?.toLowerCase() === 'rejected',
            ).length,
            pending: regularServiceAccounts.filter(
              r =>
                r.source === 'gitlab' &&
                (!r.sign_off_status ||
                  r.sign_off_status?.toLowerCase() === 'pending'),
            ).length,
            changes: {
              added: freshServiceAccounts.filter(
                fresh =>
                  fresh.source === 'gitlab' &&
                  !regularServiceAccounts.some(
                    reg => reg.service_account === fresh.service_account,
                  ),
              ).length,
              removed: regularServiceAccounts.filter(
                reg =>
                  reg.source === 'gitlab' &&
                  !freshServiceAccounts.some(
                    fresh => fresh.service_account === reg.service_account,
                  ),
              ).length,
              modified: regularServiceAccounts.filter(reg => {
                if (reg.source !== 'gitlab') return false;
                const fresh = freshServiceAccounts.find(
                  f => f.service_account === reg.service_account,
                );
                return (
                  fresh &&
                  (fresh.user_role !== reg.user_role ||
                    fresh.manager !== reg.manager ||
                    fresh.app_delegate !== reg.app_delegate)
                );
              }).length,
            },
          },
          ldap: {
            total: regularServiceAccounts.filter(r => r.source === 'ldap')
              .length,
            fresh: freshServiceAccounts.filter(r => r.source === 'ldap').length,
            approved: regularServiceAccounts.filter(
              r =>
                r.source === 'ldap' &&
                r.sign_off_status?.toLowerCase() === 'approved',
            ).length,
            rejected: regularServiceAccounts.filter(
              r =>
                r.source === 'ldap' &&
                r.sign_off_status?.toLowerCase() === 'rejected',
            ).length,
            pending: regularServiceAccounts.filter(
              r =>
                r.source === 'ldap' &&
                (!r.sign_off_status ||
                  r.sign_off_status?.toLowerCase() === 'pending'),
            ).length,
            changes: {
              added: freshServiceAccounts.filter(
                fresh =>
                  fresh.source === 'ldap' &&
                  !regularServiceAccounts.some(
                    reg => reg.service_account === fresh.service_account,
                  ),
              ).length,
              removed: regularServiceAccounts.filter(
                reg =>
                  reg.source === 'ldap' &&
                  !freshServiceAccounts.some(
                    fresh => fresh.service_account === reg.service_account,
                  ),
              ).length,
              modified: regularServiceAccounts.filter(reg => {
                if (reg.source !== 'ldap') return false;
                const fresh = freshServiceAccounts.find(
                  f => f.service_account === reg.service_account,
                );
                return (
                  fresh &&
                  (fresh.user_role !== reg.user_role ||
                    fresh.manager !== reg.manager ||
                    fresh.app_delegate !== reg.app_delegate)
                );
              }).length,
            },
          },
        };

        // Calculate total reviews and rejections across all sources
        const totalReviews = {
          before: regularGroupAccess.length + regularServiceAccounts.length,
          after: freshGroupAccess.length + freshServiceAccounts.length,
          change:
            freshGroupAccess.length +
            freshServiceAccounts.length -
            (regularGroupAccess.length + regularServiceAccounts.length),
          approved:
            regularGroupAccess.filter(
              r => r.sign_off_status?.toLowerCase() === 'approved',
            ).length +
            regularServiceAccounts.filter(
              r => r.sign_off_status?.toLowerCase() === 'approved',
            ).length,
          rejected:
            regularGroupAccess.filter(
              r => r.sign_off_status?.toLowerCase() === 'rejected',
            ).length +
            regularServiceAccounts.filter(
              r => r.sign_off_status?.toLowerCase() === 'rejected',
            ).length,
          pending:
            regularGroupAccess.filter(
              r =>
                !r.sign_off_status ||
                r.sign_off_status?.toLowerCase() === 'pending',
            ).length +
            regularServiceAccounts.filter(
              r =>
                !r.sign_off_status ||
                r.sign_off_status?.toLowerCase() === 'pending',
            ).length,
          status: 'neutral',
        };

        // Update status based on changes
        if (totalReviews.change > 0) totalReviews.status = 'positive';
        else if (totalReviews.change < 0) totalReviews.status = 'negative';

        return res.json({
          app_name,
          frequency,
          period,
          statistics: {
            group_access: groupAccessStats,
            service_accounts: serviceAccountStats,
            statusOverview: {
              totalReviews,
            },
          },
          generated_at: new Date().toISOString(),
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';
        logger.error('Failed to generate statistics', {
          error: errorMessage,
          app_name,
          frequency,
          period,
        });
        return res.status(500).json({ error: errorMessage });
      }
    },
  );
  /**
   * GET /audits/:app_name/:frequency/:period/metadata
   * Retrieves metadata for a specific audit.
   *
   * @route GET /audits/:app_name/:frequency/:period/metadata
   * @param {string} req.params.app_name - Application name
   * @param {string} req.params.frequency - Audit frequency
   * @param {string} req.params.period - Audit period
   * @returns {Object} 200 - Audit metadata
   * @returns {Object} 404 - Audit not found
   * @returns {Object} 500 - Error response
   */
  auditSummaryRouter.get(
    '/audits/:app_name/:frequency/:period/metadata',
    async (req, res) => {
      const { app_name, frequency, period } = req.params;

      try {
        // First get the audit to get its ID
        const audit = await database.findAuditByAppNamePeriod(
          app_name,
          frequency,
          period,
        );

        if (!audit) {
          return res.status(404).json({ error: 'Audit not found' });
        }

        const metadata = await database.getAuditMetadata(audit.id);
        return res.json(
          metadata || { documentation_evidence: {}, auditor_notes: {} },
        );
      } catch (error) {
        logger.error('Failed to fetch audit metadata', {
          error: error instanceof Error ? error.message : String(error),
        });
        return res
          .status(500)
          .json({ error: 'Failed to fetch audit metadata' });
      }
    },
  );

  /**
   * PUT /audits/:app_name/:frequency/:period/metadata
   * Updates metadata for a specific audit.
   *
   * @route PUT /audits/:app_name/:frequency/:period/metadata
   * @param {string} req.params.app_name - Application name
   * @param {string} req.params.frequency - Audit frequency
   * @param {string} req.params.period - Audit period
   * @param {Object} req.body - Metadata to update
   * @returns {Object} 200 - Updated metadata
   * @returns {Object} 404 - Audit not found
   * @returns {Object} 500 - Error response
   */
  auditSummaryRouter.put(
    '/audits/:app_name/:frequency/:period/metadata',
    async (req, res) => {
      const { app_name, frequency, period } = req.params;
      const { documentation_evidence, auditor_notes } = req.body;

      try {
        // First get the audit to get its ID
        const audit = await database.findAuditByAppNamePeriod(
          app_name,
          frequency,
          period,
        );

        if (!audit) {
          return res.status(404).json({ error: 'Audit not found' });
        }

        const metadata = await database.updateAuditMetadata(audit.id, {
          documentation_evidence,
          auditor_notes,
        });

        // Create activity stream event for metadata update
        await database.createActivityEvent({
          event_type: 'AUDIT_METADATA_UPDATED',
          app_name,
          frequency,
          period,
          performed_by: 'system',
          metadata: {
            audit_id: audit.id,
            update_type: 'metadata',
          },
        });

        return res.json(metadata);
      } catch (error) {
        logger.error('Failed to update audit metadata', {
          error: error instanceof Error ? error.message : String(error),
        });
        return res
          .status(500)
          .json({ error: 'Failed to update audit metadata' });
      }
    },
  );
  /**
   * POST /audits/:app_name/:frequency/:period/complete
   * Completes an audit by updating its status and progress.
   *
   * @route POST /audits/:app_name/:frequency/:period/complete
   * @param {string} req.params.app_name - Application name
   * @param {string} req.params.frequency - Audit frequency
   * @param {string} req.params.period - Audit period
   * @param {Object} req.body - Completion details
   * @param {string} req.body.performed_by - User who completed the audit
   * @returns {Object} 200 - Success response
   * @returns {Object} 404 - Audit not found
   * @returns {Object} 500 - Error response
   */
  auditSummaryRouter.post(
    '/audits/:app_name/:frequency/:period/complete',
    async (req, res) => {
      const { app_name, frequency, period } = req.params;
      const { performed_by } = req.body;

      if (!performed_by) {
        return res.status(400).json({
          error: 'Missing required field: performed_by',
        });
      }

      try {
        // Get the audit to verify it exists
        const audit = await database.findAuditByAppNamePeriod(
          app_name,
          frequency,
          period,
        );

        if (!audit) {
          return res.status(404).json({ error: 'Audit not found' });
        }

        // Update audit status and progress
        await database.updateAudit(app_name, frequency, period, {
          progress: 'completed',
          status: 'completed',
          completed_at: new Date(),
          completed_by: performed_by,
        });

        // Create activity stream event
        await database.createActivityEvent({
          event_type: 'AUDIT_COMPLETED',
          app_name,
          frequency,
          period,
          performed_by,
          metadata: {
            audit_id: audit.id,
            jira_key: audit.jira_key,
            completed_at: new Date().toISOString(),
          },
        });

        return res.json({
          message: 'Audit completed successfully',
          audit_id: audit.id,
        });
      } catch (error) {
        logger.error('Failed to complete audit', {
          error: error instanceof Error ? error.message : String(error),
          app_name,
          frequency,
          period,
        });
        return res.status(500).json({ error: 'Failed to complete audit' });
      }
    },
  );
  return auditSummaryRouter;
}
