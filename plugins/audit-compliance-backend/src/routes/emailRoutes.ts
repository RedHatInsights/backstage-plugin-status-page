import express from 'express';
import Router from 'express-promise-router';
import { LoggerService, RootConfigService, HttpAuthService } from '@backstage/backend-plugin-api';
import { CustomAuthorizer } from '../types/permissions';
import { normalizeAppName } from '../api/authz';
import { 
  checkRbacPermission,
  validateAppExists,
  createPermissionDeniedResponse,
  createAppNotFoundResponse
} from '../api/rbac';
import { Knex } from 'knex';
import { EmailService } from '../database/integrations/EmailService';
import { AuditComplianceDatabase } from '../database/AuditComplianceDatabase';

/**
 * Creates the plugin router with all endpoint definitions.
 * @param config - The root config service
 * @param logger - The logger service
 * @returns An Express router instance with all routes
 */
export async function createEmailRouter(
  config: RootConfigService,
  logger: LoggerService,
  _permissions?: CustomAuthorizer,
  _httpAuth?: HttpAuthService,
  _knex?: Knex,
): Promise<express.Router> {
  const emailService = new EmailService(config, logger);
  const database = await AuditComplianceDatabase.create({
    knex: _knex!,
    skipMigrations: true,
    logger,
    config,
  });

  const emailRouter = Router();
  const rbacEnabled = (config?.getOptionalBoolean?.('auditCompliance.rbac.enabled') ?? true) as boolean;

  /**
   * POST /send-email
   * Sends an email using the email service.
   *
   * @route POST /send-email
   * @param {string} req.body.to - Recipient email address
   * @param {string} req.body.subject - Email subject
   * @param {string} req.body.html - HTML content of the email
   * @param {string} [req.body.replyTo] - Optional reply-to address
   * @returns {Object} 200 - Email sent successfully
   * @returns {Object} 400 - Missing required fields
   * @returns {Object} 500 - Internal error sending email
   */
  emailRouter.post('/send-email', async (req, res) => {
    try {
      const { to, subject, html, replyTo, app_name } = req.body;

      if (!app_name) {
        return res.status(400).json({ error: 'app_name is required in request body' });
      }

      const normalizedAppName = normalizeAppName(app_name);

      // Validate app exists
      const appExists = await validateAppExists(normalizedAppName, database);
      if (!appExists) {
        return res.status(404).json(createAppNotFoundResponse(normalizedAppName));
      }

      // Check RBAC permissions for email operations
      if (rbacEnabled && _httpAuth) {
        const rbacCheck = await checkRbacPermission({
          req,
          appName: normalizedAppName,
          requiredPermission: 'send_emails',
          knex: _knex!,
          httpAuth: _httpAuth,
          logger,
          rbacEnabled,
        });

        if (!rbacCheck.hasPermission) {
          return res.status(403).json(createPermissionDeniedResponse('send_emails', rbacCheck.username, rbacCheck.userRoles));
        }
      }

      if (!to || !subject || !html) {
        return res.status(400).json({ error: 'Missing required fields: to, subject, html' });
      }

      await emailService.sendMail({ to, subject, html, replyTo });
      return res.status(200).json({ message: 'Email sent successfully' });
    } catch (error: any) {
      logger.error(`Failed to send email: ${error.message}`);
      return res.status(500).json({ error: 'Failed to send email' });
    }
  });

  return emailRouter;
}
