import { Knex } from 'knex';
import express from 'express';
import Router from 'express-promise-router';
import { AuditComplianceDatabase } from '../database/AuditComplianceDatabase';

interface AccountEntry {
  type: string;
  source: string;
  account_name: string;
}

/**
 * Normalizes application data by converting to lowercase and replacing spaces with hyphens
 * @param data - The application data to normalize
 * @returns Normalized application data
 */
function normalizeApplicationData(data: any) {
  const normalized = { ...data };

  // Normalize app_name: lowercase and replace spaces with hyphens
  if (normalized.app_name) {
    normalized.app_name = normalized.app_name
      .toLowerCase()
      .replace(/\s+/g, '-');
  }

  // Normalize other string fields to lowercase
  const fieldsToNormalize = [
    'cmdb_id',
    'environment',
    'app_owner',
    'app_delegate',
  ];
  fieldsToNormalize.forEach(field => {
    if (normalized[field] && typeof normalized[field] === 'string') {
      normalized[field] = normalized[field].toLowerCase();
    }
  });

  // Normalize account names in accounts array if present
  if (Array.isArray(normalized.accounts)) {
    normalized.accounts = normalized.accounts.map((account: AccountEntry) => ({
      ...account,
      account_name: account.account_name.toLowerCase(),
      type: account.type.toLowerCase(),
      source: account.source.toLowerCase(),
    }));
  }

  return normalized;
}

/**
 * Creates the plugin router with all endpoint definitions.
 * @param knex - The shared Knex client
 * @param logger - The logger service
 * @param config - The configuration service
 * @returns An Express router instance with all routes
 */
export async function createAuditApplicationsRouter(
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

  const auditApplicationsRouter = Router();
  /**
   * GET /applications
   * Retrieves either all applications or distinct app owners for a specific application.
   *
   * @route GET /applications
   * @query {string} [app_name] - Optional application name to filter by
   * @returns {Array} 200 - List of applications or app owners
   * @returns {Object} 500 - Error response
   */
  auditApplicationsRouter.get('/applications', async (req, res) => {
    const { app_name } = req.query;

    if (app_name) {
      // Normalize the app_name query parameter
      const normalizedAppName = (app_name as string)
        .toLowerCase()
        .replace(/\s+/g, '-');
      try {
        const appOwners = await database.getDistinctAppOwners(
          normalizedAppName,
        );
        res.json(appOwners);
      } catch (error) {
        logger.error('Failed to fetch app owners', {
          error: error instanceof Error ? error.message : String(error),
        });
        res.status(500).json({ error: 'Failed to fetch app owners' });
      }
    } else {
      const apps = await database.getAllApplications();
      res.json(apps);
    }
  });

  /**
   * POST /applications
   * Creates a new application record.
   *
   * @route POST /applications
   * @param {Object} req.body - Application details
   * @returns {Object} 201 - Created application ID
   * @returns {Object} 500 - Error response
   */
  auditApplicationsRouter.post('/applications', async (req, res) => {
    const normalizedApp = normalizeApplicationData(req.body);
    const id = await database.insertApplication(normalizedApp);
    res.status(201).json({ id });
  });

  /**
   * PUT /applications/:id
   * Updates an existing application record.
   *
   * @route PUT /applications/:id
   * @param {string} req.params.id - Application ID
   * @param {Object} req.body - Updated application details
   * @returns {void} 204 - Success response
   * @returns {Object} 500 - Error response
   */
  auditApplicationsRouter.put('/applications/:id', async (req, res) => {
    const { id } = req.params;
    const normalizedApp = normalizeApplicationData(req.body);
    await database.updateApplication(Number(id), normalizedApp);
    res.sendStatus(204);
  });

  /**
   * GET /application-details/:app_name
   * Retrieves detailed information about an application.
   *
   * @route GET /application-details/:app_name
   * @param {string} req.params.app_name - Application name
   * @returns {Object} 200 - Application details
   * @returns {Object} 400 - Missing parameters error
   * @returns {Object} 404 - Application not found
   * @returns {Object} 500 - Error response
   */
  auditApplicationsRouter.get(
    '/application-details/:app_name',
    async (req, res) => {
      const normalizedAppName = req.params.app_name
        .toLowerCase()
        .replace(/\s+/g, '-');

      if (!normalizedAppName) {
        return res.status(400).json({
          error: 'Missing required parameter: app_name',
        });
      }

      try {
        // Use the shared knex client for all queries
        const db = knex;

        // Get application details using normalized app name
        const appDetails = await database.getApplicationDetails(
          normalizedAppName,
        );
        if (!appDetails) {
          return res.status(404).json({ error: 'Application not found' });
        }

        // Get distinct app owners using normalized app name
        const appOwners = await database.getDistinctAppOwners(
          normalizedAppName,
        );

        // Get distinct app delegates using normalized app name
        const appDelegates = await db('applications')
          .where('app_name', normalizedAppName)
          .distinct('app_delegate')
          .pluck('app_delegate')
          .then(delegates => delegates.filter(Boolean));

        // Get Rover accounts using normalized app name
        const roverAccounts = await db('group_access_reports')
          .where({
            app_name: normalizedAppName,
            source: 'rover',
          })
          .distinct('account_name')
          .pluck('account_name');

        // Get GitLab accounts using normalized app name
        const gitlabAccounts = await db('group_access_reports')
          .where({
            app_name: normalizedAppName,
            source: 'gitlab',
          })
          .distinct('account_name')
          .pluck('account_name');

        // Get service accounts using normalized app name
        const serviceAccounts = await db('service_account_access_review')
          .where('app_name', normalizedAppName)
          .distinct('service_account')
          .pluck('service_account');

        return res.json({
          app_name: appDetails.app_name,
          cmdb_id: appDetails.cmdb_id,
          environment: appDetails.environment,
          app_owner: appOwners.join(', '),
          app_delegate: appDelegates.join(', '),
          jira_project: appDetails.jira_project,
          accounts: {
            rover: roverAccounts,
            gitlab: gitlabAccounts,
            service_accounts: serviceAccounts,
          },
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        logger.error('Failed to fetch application details', {
          error: errorMessage,
        });
        return res
          .status(500)
          .json({ error: 'Failed to fetch application details' });
      }
    },
  );

  /**
   * POST /applications/onboarding
   * Creates a new application with multiple account entries.
   *
   * @route POST /applications/onboarding
   * @param {Object} req.body - Application details with account entries
   * @param {string} req.body.app_name - Application name
   * @param {string} req.body.cmdb_id - CMDB identifier
   * @param {string} req.body.environment - Environment
   * @param {string} req.body.app_owner - Application owner
   * @param {string} req.body.app_delegate - Application delegate
   * @param {string} req.body.jira_project - Jira project key
   * @param {Array} req.body.accounts - Array of account entries
   * @returns {Object} 201 - Created application with accounts
   * @returns {Object} 400 - Invalid request data
   * @returns {Object} 500 - Server error
   */
  auditApplicationsRouter.post('/applications/onboarding', async (req, res) => {
    try {
      const normalizedData = normalizeApplicationData(req.body);
      const {
        app_name,
        cmdb_id,
        environment,
        app_owner,
        app_delegate,
        accounts,
      } = normalizedData;

      // Validate required fields
      if (
        !app_name ||
        !cmdb_id ||
        !environment ||
        !app_owner ||
        !app_delegate
      ) {
        return res.status(400).json({
          error:
            'Missing required fields: app_name, cmdb_id, environment, app_owner, and app_delegate are required',
        });
      }

      // Validate accounts array
      if (!Array.isArray(accounts) || accounts.length === 0) {
        return res.status(400).json({
          error: 'At least one account entry is required',
        });
      }

      // Validate each account entry
      for (const account of accounts) {
        if (!account.type || !account.source || !account.account_name) {
          return res.status(400).json({
            error:
              'Each account entry must have type, source, and account_name',
          });
        }
        if (!['service-account', 'rover-group-name'].includes(account.type)) {
          return res.status(400).json({
            error:
              'Account type must be either service-account or rover-group-name',
          });
        }
        if (!['rover', 'gitlab'].includes(account.source)) {
          return res.status(400).json({
            error: 'Account source must be either rover or gitlab',
          });
        }
      }

      // Check if application already exists using normalized app name
      const existingApp = await database.getApplicationDetails(app_name);
      if (existingApp) {
        return res.status(409).json({
          error: `Application with name ${app_name} already exists`,
        });
      }

      // Create application with accounts using normalized data
      const result = await database.createApplicationWithAccounts(
        normalizedData,
      );

      return res.status(201).json(result);
    } catch (error) {
      logger.error('Failed to create application with accounts', {
        error: error instanceof Error ? error.message : String(error),
      });
      return res.status(500).json({
        error: 'Failed to create application with accounts',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  return auditApplicationsRouter;
}
