import express from 'express';
import Router from 'express-promise-router';
import {
  LoggerService,
  RootConfigService,
} from '@backstage/backend-plugin-api';
import { EmailService } from '../database/EmailService';

/**
 * Creates the plugin router with all endpoint definitions.
 * @param config - The root config service
 * @param logger - The logger service
 * @returns An Express router instance with all routes
 */
export async function createEmailRouter(
  config: RootConfigService,
  logger: LoggerService,
): Promise<express.Router> {
  const emailService = new EmailService(config, logger);

  const emailRouter = Router();

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
    const { to, subject, html, replyTo } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      await emailService.sendMail({ to, subject, html, replyTo });
      return res.status(200).json({ message: 'Email sent successfully' });
    } catch (error: any) {
      logger.error(`Failed to send email: ${error.message}`);
      return res.status(500).json({ error: 'Failed to send email' });
    }
  });

  return emailRouter;
}
