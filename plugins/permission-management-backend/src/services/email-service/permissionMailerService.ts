import { LoggerService } from '@backstage/backend-plugin-api';
import { Config } from '@backstage/config';
import { createTransport, Transporter } from 'nodemailer';
import { resolvePackagePath } from '@backstage/backend-plugin-api';

import * as fs from 'fs';
import path from 'path';


interface MailOptions {
  to: string | Array<string>;
  subject: string;
  html: string;
  replyTo?: string | Array<string>;
}

export class PermissionEmailService {
  private readonly transporter: Transporter;
  private readonly from: string;
  private readonly logger: LoggerService;

  constructor(config: Config, logger: LoggerService) {
    this.logger = logger;

    const host = config.getString('permissionManagement.email.host');
    const port = config.getNumber('permissionManagement.email.port');
    const secure = config.getBoolean('permissionManagement.email.secure');
    const from = config.getString('permissionManagement.email.from');
    const caCertPath = config.getString('permissionManagement.email.caCert');

    const customCa = caCertPath ? fs.readFileSync(caCertPath) : undefined;

    this.from = from;
    this.transporter = createTransport({
      host,
      port,
      secure,
      tls: customCa ? { ca: customCa } : undefined,
    });
  }

  async sendMail(options: MailOptions): Promise<void> {
    const { to, subject, html, replyTo } = options;
    try {
      this.logger.info(`Sending email to ${to} with subject "${subject}"`);
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        html,
        replyTo,
        cc: replyTo,
      });
    } catch (error: any) {
      this.logger.error(`Email send failed: ${error.message}`);
      throw error;
    }
  }

  async processEmail(to: string | Array<string>, type: string, data: any) {
    try {
      const subjectMap: Record<string, string> = {
        'owners-request': 'Permission request received for Escalation Forecaster.',
        'member- ack': 'Permission request update for Escalation Forecaster.',
        'member-approved': 'Your permission request has been approved.',
        'member-rejected': 'Your permission request has been rejected.',
      };

      const subject = subjectMap[type] || 'Permission request update';

      const templatePath = path.join(
        resolvePackagePath('@appdev/backstage-plugin-permission-management-backend'),
        `templates/${type}.html`,
      );

      let template = fs.readFileSync(templatePath, 'utf-8');

      template = template
        .replace(/{{requestor}}/gi, data.userName || '')
        .replace(/{{role}}/gi, data.role || '')
        .replace(/{{year}}/gi, new Date().getFullYear().toString())
        .replace(/{{rejectionReason}}/gi, data.rejectionReason || '');

      await this.sendMail({ to, subject, html: template });
    } catch (error: any) {
      this.logger.error(`Email send failed: ${error.message}`);
      throw error;
    }
  }
}
