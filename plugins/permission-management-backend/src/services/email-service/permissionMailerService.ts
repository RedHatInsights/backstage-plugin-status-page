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
        
      const subject =
        type === 'owners'
          ? 'Permission request received for Escalation Forecaster.'
          : 'Permission request update for Escalation Forecaster.';
          
      const ownersTemplatePath = path.join(
        resolvePackagePath('@appdev/backstage-plugin-permission-management-backend'),
        'templates/owners-request.html',
      );
      let ownersTemplate = fs.readFileSync(ownersTemplatePath, 'utf-8');
      ownersTemplate = ownersTemplate.replace(
        '{{requestor}}', data.userName,
      ).replace('{{role}}', data.role);

      const userTemplatePath = path.join(
        resolvePackagePath('@appdev/backstage-plugin-permission-management-backend'),
        'templates/member-ack.html',
      );
      let userTemplate = fs.readFileSync(userTemplatePath, 'utf-8');
      userTemplate = userTemplate.replace('{{requestor}}', data.userName);

      const htmlContent = type === 'owners' ? ownersTemplate : userTemplate;

      await this.sendMail({ to, subject, html: htmlContent });
    } catch (error: any) {
      this.logger.error(`Email send failed: ${error.message}`);
      throw error;
    }
  }
}
