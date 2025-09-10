import { Knex } from 'knex';
import express from 'express';
import Router from 'express-promise-router';
import { AuditComplianceDatabase } from '../database/AuditComplianceDatabase';
import { RoverDatabase } from '../database/integrations/RoverIntegration';
import { GitLabDatabase } from '../database/integrations/GitLabIntegration';

/**
 * Creates the compliance manager router with all endpoint definitions.
 * @param knex - The Knex client
 * @param config - The root config service
 * @param logger - The logger service
 * @returns An Express router instance with all compliance manager routes
 */
export async function createComplianceManagerRouter(
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

  const complianceManagerRouter = Router();

  // /**
  //  * GET /compliance/applications
  //  * Retrieves all applications for compliance manager.
  //  *
  //  * @route GET /compliance/applications
  //  * @returns {Array} 200 - List of all applications
  //  * @returns {Object} 500 - Error response
  //  */
  // complianceManagerRouter.get('/compliance/applications', async (req, res) => {
  //   try {
  //     const applications = await database.getAllApplications();

  //     // Transform to include id field for frontend compatibility
  //     const transformedApplications = applications.map((app, index) => ({
  //       id: app.id || index.toString(), // Use existing id or generate one
  //       app_name: app.app_name,
  //       app_owner: app.app_owner,
  //       cmdb_id: app.cmdb_id,
  //     }));

  //     res.json(transformedApplications);
  //   } catch (error) {
  //     logger.error('Failed to fetch applications for compliance manager', {
  //       error: error instanceof Error ? error.message : String(error),
  //     });
  //     res.status(500).json({ error: 'Failed to fetch applications' });
  //   }
  // });

  /**
   * GET /compliance/audit-history
   * Retrieves audit history for compliance overview.
   *
   * @route GET /compliance/audit-history
   * @returns {Array} 200 - List of recent audits
   * @returns {Object} 500 - Error response
   */
  complianceManagerRouter.get('/compliance/audit-history', async (req, res) => {
    try {
      const audits = await database.getAllAudits();

      // Transform to include application details and format for frontend
      const auditHistory = audits.map(audit => ({
        application_id: audit.id?.toString() || '',
        app_name: audit.app_name,
        frequency: audit.frequency,
        period: audit.period,
        status: audit.progress || 'AUDIT_STARTED',
        created_at: audit.created_at,
        jira_key: audit.jira_key || 'N/A',
      }));

      res.json(auditHistory);
    } catch (error) {
      logger.error('Failed to fetch audit history for compliance manager', {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({ error: 'Failed to fetch audit history' });
    }
  });

  /**
   * POST /compliance/bulk-initiate-audits
   * Initiates multiple audits for selected applications.
   *
   * @route POST /compliance/bulk-initiate-audits
   * @param {Object} req.body - Bulk audit request
   * @param {Array} req.body.audits - Array of audit configurations
   * @param {string} req.body.audits[].application_id - Application ID
   * @param {string} req.body.audits[].frequency - Audit frequency (quarterly/yearly)
   * @param {string} req.body.audits[].period - Audit period
   * @param {string} req.body.audits[].initiated_by - User who initiated the audit
   * @returns {Object} 201 - Bulk audit initiation successful
   * @returns {Object} 400 - Invalid request data
   * @returns {Object} 500 - Error response
   */
  complianceManagerRouter.post(
    '/compliance/bulk-initiate-audits',
    async (req, res) => {
      try {
        const { audits } = req.body;

        // Validate request
        if (!audits || !Array.isArray(audits) || audits.length === 0) {
          return res.status(400).json({
            error: 'audits array is required and must not be empty',
          });
        }

        // Validate each audit configuration
        for (const audit of audits) {
          if (!audit.application_id || !audit.frequency || !audit.period) {
            return res.status(400).json({
              error:
                'Each audit must have application_id, frequency, and period',
            });
          }

          if (!['quarterly', 'yearly'].includes(audit.frequency)) {
            return res.status(400).json({
              error: 'Frequency must be either "quarterly" or "yearly"',
            });
          }
        }

        // Get all applications for validation
        const applications = await database.getAllApplications();
        const validAppNames = applications.map(app => app.app_name);
        const validApplicationIds = applications
          .map(app => app.id?.toString())
          .filter(Boolean);

        // Check for invalid application IDs or app names
        const invalidAudits = [];
        for (const audit of audits) {
          const hasValidId = validApplicationIds.includes(audit.application_id);
          const hasValidAppName = validAppNames.includes(audit.app_name);

          if (!hasValidId && !hasValidAppName) {
            invalidAudits.push({
              application_id: audit.application_id,
              app_name: audit.app_name,
              error: 'Application not found in database',
            });
          }
        }

        if (invalidAudits.length > 0) {
          return res.status(400).json({
            error: 'Invalid applications found',
            details: invalidAudits,
            available_applications: validAppNames.slice(0, 10), // Show first 10 available apps
          });
        }

        // Create audit records for each application
        const createdAudits = [];
        const errors = [];

        for (const auditConfig of audits) {
          try {
            // Get application details if app_name is not provided
            let appName = auditConfig.app_name;
            if (!appName) {
              const application = applications.find(
                app => app.id?.toString() === auditConfig.application_id,
              );
              if (!application) {
                errors.push({
                  application_id: auditConfig.application_id,
                  error: 'Application not found',
                });
                continue;
              }
              appName = application.app_name;
            }

            // Check if audit already exists
            const existingAudit = await database.findAuditByAppNamePeriod(
              appName,
              auditConfig.frequency,
              auditConfig.period,
            );

            if (existingAudit) {
              errors.push({
                application_id: auditConfig.application_id,
                error: `Audit already exists for ${auditConfig.frequency} ${auditConfig.period}`,
              });
              continue;
            }

            // First clear any existing data for this app/period combination
            const db = await knex;
            await db('group_access_reports')
              .where({
                app_name: appName,
                frequency: auditConfig.frequency,
                period: auditConfig.period,
              })
              .delete();
            await db('service_account_access_review')
              .where({
                app_name: appName,
                frequency: auditConfig.frequency,
                period: auditConfig.period,
              })
              .delete();

            // Create audit record
            const auditData = {
              app_name: appName,
              frequency: auditConfig.frequency,
              period: auditConfig.period,
              progress: 'audit_started',
              created_at: new Date().toISOString(),
            };

            const auditId = await database.insertAudit(auditData);

            // Create activity event
            await database.createActivityEvent({
              event_type: 'AUDIT_INITIATED',
              app_name: appName,
              frequency: auditConfig.frequency,
              period: auditConfig.period,
              performed_by: auditConfig.initiated_by || 'compliance-manager',
              metadata: {
                audit_id: auditId,
                jira_key: null,
                bulk_initiation: true,
              },
            });

            // Get application details
            const appDetails = await database.getApplicationDetails(appName);

            if (!appDetails) {
              logger.warn(`Application details not found for ${appName}`);
            }

            // Generate reports from all sources
            const reportPromises = [
              // Generate Rover report
              roverStore
                .generateRoverData(
                  appName,
                  auditConfig.frequency,
                  auditConfig.period,
                )
                .catch(error => {
                  logger.error('Failed to generate Rover report', {
                    app_name: appName,
                    error:
                      error instanceof Error ? error.message : String(error),
                  });
                  return null;
                }),
              // Generate GitLab report
              gitlabStore
                .generateGitLabData(
                  appName,
                  auditConfig.frequency,
                  auditConfig.period,
                )
                .catch(error => {
                  logger.error('Failed to generate GitLab report', {
                    app_name: appName,
                    error:
                      error instanceof Error ? error.message : String(error),
                  });
                  return null;
                }),
              // Generate LDAP report
              roverStore
                .generateLDAPData(
                  appName,
                  auditConfig.frequency,
                  auditConfig.period,
                )
                .catch(error => {
                  logger.error('Failed to generate LDAP report', {
                    app_name: appName,
                    error:
                      error instanceof Error ? error.message : String(error),
                  });
                  return null;
                }),
            ];

            // Wait for all report generations to complete
            const reportResults = await Promise.all(reportPromises);
            const successfulReports = reportResults.filter(
              result => result !== null,
            );

            // Try to create Jira ticket for the audit (as an Epic)
            let jiraTicket = null;
            let jiraCreationFailed = false;
            try {
              jiraTicket = await database.createAuditJiraTicket({
                app_name: appName,
                frequency: auditConfig.frequency,
                period: auditConfig.period,
              });
              // Update the audit record with the Jira ticket key
              await database.updateAudit(
                appName,
                auditConfig.frequency,
                auditConfig.period,
                {
                  jira_key: jiraTicket.key,
                  jira_status: jiraTicket.status,
                },
              );
            } catch (jiraError) {
              logger.error('Failed to create JIRA epic', {
                app_name: appName,
                error:
                  jiraError instanceof Error
                    ? jiraError.message
                    : String(jiraError),
              });
              jiraCreationFailed = true;
              // Update the audit record with jira_key: 'N/A'
              await database.updateAudit(
                appName,
                auditConfig.frequency,
                auditConfig.period,
                {
                  jira_key: 'N/A',
                  jira_status: 'N/A',
                },
              );
            }

            // Set progress to 'details_under_review' after data is fetched and JIRA is handled
            await database.updateAuditProgress(
              appName,
              auditConfig.frequency,
              auditConfig.period,
              'details_under_review',
            );

            createdAudits.push({
              id: auditId,
              application_id: auditConfig.application_id,
              app_name: appName,
              frequency: auditConfig.frequency,
              period: auditConfig.period,
              status: 'details_under_review',
              reports_generated: successfulReports.length,
              jira_creation_failed: jiraCreationFailed,
              jira_ticket: jiraTicket,
            });
          } catch (error) {
            logger.error('Failed to create audit for application', {
              application_id: auditConfig.application_id,
              error: error instanceof Error ? error.message : String(error),
            });
            errors.push({
              application_id: auditConfig.application_id,
              error: 'Failed to create audit',
            });
          }
        }

        // Log bulk initiation
        logger.info('Bulk audit initiation completed', {
          total_requested: audits.length,
          successful: createdAudits.length,
          failed: errors.length,
          initiated_by: audits[0]?.initiated_by || 'compliance-manager',
        });

        return res.status(201).json({
          message: `Successfully initiated ${createdAudits.length} audit(s)`,
          created_audits: createdAudits,
          errors: errors,
          summary: {
            total_requested: audits.length,
            successful: createdAudits.length,
            failed: errors.length,
          },
        });
      } catch (error) {
        logger.error('Failed to initiate bulk audits', {
          error: error instanceof Error ? error.message : String(error),
        });
        return res.status(500).json({
          error: 'Failed to initiate bulk audits',
          details: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  /**
   * POST /compliance/test-applications
   * Adds test applications for development/testing purposes.
   *
   * @route POST /compliance/test-applications
   * @returns {Object} 201 - Test applications created
   * @returns {Object} 500 - Error response
   */
  complianceManagerRouter.post(
    '/compliance/test-applications',
    async (req, res) => {
      try {
        const testApplications = [
          {
            app_name: 'dd',
            app_owner: 'Test Owner 1',
            app_delegate: 'Test Delegate 1',
            cmdb_id: 'DD-001',
          },
          {
            app_name: 'test',
            app_owner: 'Test Owner 2',
            app_delegate: 'Test Delegate 2',
            cmdb_id: 'TEST-001',
          },
          {
            app_name: 'testing',
            app_owner: 'Test Owner 3',
            app_delegate: 'Test Delegate 3',
            cmdb_id: 'TESTING-001',
          },
        ];

        const createdApps = [];
        for (const appData of testApplications) {
          try {
            const appId = await database.insertApplication(appData);
            createdApps.push({ id: appId, ...appData });
          } catch (error) {
            // App might already exist, skip
            logger.debug('Application might already exist', {
              app_name: appData.app_name,
            });
          }
        }

        res.status(201).json({
          message: `Created ${createdApps.length} test applications`,
          applications: createdApps,
        });
      } catch (error) {
        logger.error('Failed to create test applications', {
          error: error instanceof Error ? error.message : String(error),
        });
        res.status(500).json({ error: 'Failed to create test applications' });
      }
    },
  );

  /**
   * GET /compliance/summary
   * Retrieves compliance summary statistics.
   *
   * @route GET /compliance/summary
   * @returns {Object} 200 - Compliance summary statistics
   * @returns {Object} 500 - Error response
   */
  complianceManagerRouter.get('/compliance/summary', async (req, res) => {
    try {
      const applications = await database.getAllApplications();
      const audits = await database.getAllAudits();

      // Calculate compliance statistics
      const totalApplications = applications.length;

      // Group audits by application and get latest status
      const appStatuses = new Map();
      audits.forEach(audit => {
        const key = audit.app_name;
        const existing = appStatuses.get(key);
        if (
          !existing ||
          new Date(audit.created_at) > new Date(existing.created_at)
        ) {
          appStatuses.set(key, audit);
        }
      });

      let compliant = 0;
      let nonCompliant = 0;
      let inProgress = 0;
      let pending = 0;

      appStatuses.forEach(audit => {
        const status = audit.progress?.toUpperCase() || 'AUDIT_STARTED';
        switch (status) {
          case 'COMPLETED':
          case 'FINAL_SIGN_OFF_DONE':
            compliant++;
            break;
          case 'IN_PROGRESS':
          case 'DETAILS_UNDER_REVIEW':
          case 'SUMMARY_GENERATED':
            inProgress++;
            break;
          case 'AUDIT_STARTED':
            pending++;
            break;
          default:
            nonCompliant++;
        }
      });

      const summary = {
        totalApplications,
        compliant,
        nonCompliant,
        inProgress,
        pending,
        lastUpdated: new Date().toISOString(),
      };

      res.json(summary);
    } catch (error) {
      logger.error('Failed to fetch compliance summary', {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({ error: 'Failed to fetch compliance summary' });
    }
  });

  return complianceManagerRouter;
}
