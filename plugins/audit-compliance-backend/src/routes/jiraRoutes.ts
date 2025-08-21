import express from 'express';
import Router from 'express-promise-router';
import { Knex } from 'knex';
import { AuditComplianceDatabase } from '../database/AuditComplianceDatabase';
import { CustomAuthorizer } from '../types/permissions';
import { HttpAuthService } from '@backstage/backend-plugin-api';
import { normalizeAppName } from '../api/authz';
import { 
  checkRbacPermission,
  validateAppExists,
  createPermissionDeniedResponse,
  createAppNotFoundResponse
} from '../api/rbac';
import {
  fetchJiraFieldSchemas,
  transformJiraMetadataForStorage,
} from '../database/integrations/JiraIntegration';

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
  _permissions?: CustomAuthorizer,
  _httpAuth?: HttpAuthService,
): Promise<express.Router> {
  const database = await AuditComplianceDatabase.create({
    knex,
    skipMigrations: true,
    logger,
    config,
  });

  const jiraRouter = Router();
  const rbacEnabled = (config?.getOptionalBoolean?.('auditCompliance.rbac.enabled') ?? true) as boolean;

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
      // Extract app_name from request body for RBAC check
      const { app_name } = req.body;
      if (!app_name) {
        return res.status(400).json({ error: 'app_name is required in request body' });
      }

      const normalizedAppName = normalizeAppName(app_name);

      // Validate app exists
      const appExists = await validateAppExists(normalizedAppName, database);
      if (!appExists) {
        return res.status(404).json(createAppNotFoundResponse(normalizedAppName));
      }

      // Check RBAC permissions for Jira operations
      if (rbacEnabled && _httpAuth) {
        const rbacCheck = await checkRbacPermission({
          req,
          appName: normalizedAppName,
          requiredPermission: 'manage_jira',
          knex,
          httpAuth: _httpAuth,
          logger,
          rbacEnabled,
        });

        if (!rbacCheck.hasPermission) {
          return res.status(403).json(createPermissionDeniedResponse('manage_jira', rbacCheck.username, rbacCheck.userRoles));
        }
      }
      const result = await database.createAqrJiraTicketAndUpdateStatus(
        req.body,
      );

      return res.status(201).json({
        message: 'Jira ticket created and status updated.',
        ...result,
      });
    } catch (err: any) {
      logger.error('AQR ticket error:', err.message);
      return res.status(500).json({ error: err.message || 'Unknown error occurred.' });
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
      // Extract app_name from request body for RBAC check
      const { app_name } = req.body;
      if (!app_name) {
        return res.status(400).json({ error: 'app_name is required in request body' });
      }

      const normalizedAppName = normalizeAppName(app_name);

      // Validate app exists
      const appExists = await validateAppExists(normalizedAppName, database);
      if (!appExists) {
        return res.status(404).json(createAppNotFoundResponse(normalizedAppName));
      }

      // Check RBAC permissions for Jira operations
      if (rbacEnabled && _httpAuth) {
        const rbacCheck = await checkRbacPermission({
          req,
          appName: normalizedAppName,
          requiredPermission: 'manage_jira',
          knex,
          httpAuth: _httpAuth,
          logger,
          rbacEnabled,
        });

        if (!rbacCheck.hasPermission) {
          return res.status(403).json(createPermissionDeniedResponse('manage_jira', rbacCheck.username, rbacCheck.userRoles));
        }
      }
      // Map frontend parameters to backend function parameters  
      const { user_id, ...rest } = req.body;
      const mappedData = {
        service_account: user_id,
        appName: normalizedAppName,
        ...rest,
      };

      const result = await database.createServiceAccountJiraTicket(mappedData);

      return res.status(201).json({
        message: 'Service account Jira ticket created and status updated.',
        ...result,
      });
    } catch (err: any) {
      logger.error('Service account ticket error:', err.message);
      return res.status(500).json({ error: err.message || 'Unknown error occurred.' });
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
    try {
      const { id, comments, ticket_reference, app_name } = req.body;

      if (!app_name) {
        return res.status(400).json({ error: 'app_name is required in request body' });
      }

      const normalizedAppName = normalizeAppName(app_name);

      // Validate app exists
      const appExists = await validateAppExists(normalizedAppName, database);
      if (!appExists) {
        return res.status(404).json(createAppNotFoundResponse(normalizedAppName));
      }

      // Check RBAC permissions for Jira operations
      if (rbacEnabled && _httpAuth) {
        const rbacCheck = await checkRbacPermission({
          req,
          appName: normalizedAppName,
          requiredPermission: 'manage_jira',
          knex,
          httpAuth: _httpAuth,
          logger,
          rbacEnabled,
        });

        if (!rbacCheck.hasPermission) {
          return res.status(403).json(createPermissionDeniedResponse('manage_jira', rbacCheck.username, rbacCheck.userRoles));
        }
      }

      await database.addJiraCommentAndUpdateDb(id, comments, ticket_reference);
      return res.status(200).json({ message: 'Comment added successfully.' });
    } catch (err: any) {
      logger.error('Error adding Jira comment:', err.message);
      return res.status(500).json({ error: err.message || 'Unknown error occurred.' });
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
    try {
      const { id, comments, ticket_reference, app_name } = req.body;

      if (!app_name) {
        return res.status(400).json({ error: 'app_name is required in request body' });
      }

      const normalizedAppName = normalizeAppName(app_name);

      // Validate app exists
      const appExists = await validateAppExists(normalizedAppName, database);
      if (!appExists) {
        return res.status(404).json(createAppNotFoundResponse(normalizedAppName));
      }

      // Check RBAC permissions for Jira operations
      if (rbacEnabled && _httpAuth) {
        const rbacCheck = await checkRbacPermission({
          req,
          appName: normalizedAppName,
          requiredPermission: 'manage_jira',
          knex,
          httpAuth: _httpAuth,
          logger,
          rbacEnabled,
        });

        if (!rbacCheck.hasPermission) {
          return res.status(403).json(createPermissionDeniedResponse('manage_jira', rbacCheck.username, rbacCheck.userRoles));
        }
      }

      await database.addServiceAccountJiraCommentAndUpdateDb(
        id,
        comments,
        ticket_reference,
      );
      return res.status(200).json({ message: 'Comment added successfully.' });
    } catch (err: any) {
      logger.error('Error adding Jira comment (service account):', err.message);
      return res.status(500).json({ error: err.message || 'Unknown error occurred.' });
    }
  });

  /**
   * GET /jira/fields
   * Returns Jira field information including ID, name, and schema.
   *
   * @route GET /jira/fields
   * @returns {Object} 200 - Array of field objects with id, name, and schema
   * @returns {Object} 500 - Error response
   */
  jiraRouter.get('/jira/fields', async (_req, res) => {
    try {
      const fieldSchemas = await fetchJiraFieldSchemas(
        database.getLogger(),
        database.getConfig(),
      );

      const fields = Object.entries(fieldSchemas).map(([id, field]) => ({
        id,
        name: field.name || id,
        schema: field.schema || null,
        custom: field.custom || false,
      }));

      res.status(200).json(fields);
    } catch (err: any) {
      logger.error('Error fetching Jira field schemas:', err.message);
      res.status(500).json({ error: err.message || 'Unknown error occurred.' });
    }
  });

  /**
   * POST /jira/transform-metadata
   * Transforms raw Jira metadata from form input to Jira-compatible format.
   * This is useful for testing the transformation function.
   *
   * @route POST /jira/transform-metadata
   * @param {Object} req.body - Request body containing raw metadata object
   * @returns {Object} 200 - Transformed metadata
   * @returns {Object} 500 - Error response
   */
  jiraRouter.post('/jira/transform-metadata', async (req, res) => {
    try {
      const { rawMetadata, useSchemas = true } = req.body;

      if (!rawMetadata || typeof rawMetadata !== 'object') {
        res.status(400).json({
          error: 'rawMetadata is required and must be an object',
        });
        return;
      }

      let fieldSchemas: Record<string, any> | undefined;
      if (useSchemas) {
        try {
          fieldSchemas = await fetchJiraFieldSchemas(
            database.getLogger(),
            database.getConfig(),
          );
        } catch (error) {
          logger.warn('Failed to fetch field schemas, using pattern matching', {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      const transformedMetadata = transformJiraMetadataForStorage(
        rawMetadata,
        fieldSchemas,
        database.getLogger(),
      );

      res.status(200).json({
        message: 'Metadata transformed successfully',
        original: rawMetadata,
        transformed: transformedMetadata,
        schemasUsed: !!fieldSchemas,
        fieldSchemas: fieldSchemas ? Object.keys(fieldSchemas) : [],
      });
    } catch (err: any) {
      logger.error('Error transforming Jira metadata:', err.message);
      res.status(500).json({ error: err.message || 'Unknown error occurred.' });
    }
  });

  return jiraRouter;
}
