import { LoggerService } from '@backstage/backend-plugin-api';
import { Config } from '@backstage/config';
import { createTransport, Transporter } from 'nodemailer';
import { readFileSync } from 'fs';

interface MailOptions {
  to: string;
  subject: string;
  html: string;
  cc?: string;
  replyTo?: string;
}

export class EmailService {
  private readonly transporter: Transporter;
  private readonly from: string;
  private readonly logger: LoggerService;

  constructor(config: Config, logger: LoggerService) {
    this.logger = logger;

    const host = config.getString('auditCompliance.email.host');
    const port = config.getNumber('auditCompliance.email.port');
    const secure = config.getBoolean('auditCompliance.email.secure');
    const from = config.getString('auditCompliance.email.from');
    const caCertPath = config.getString('auditCompliance.email.caCert');

    const customCa = caCertPath ? readFileSync(caCertPath) : undefined;

    this.from = from;
    this.transporter = createTransport({
      host,
      port,
      secure,
      tls: customCa ? { ca: customCa } : undefined,
    });
  }

  async sendMail(options: MailOptions): Promise<void> {
    const { to, subject, html, cc, replyTo } = options;
    try {
      this.logger.info(
        `Sending email to ${to} with subject "${subject}"${
          cc ? `, cc: ${cc}` : ''
        }`,
      );
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        html,
        cc,
        replyTo,
      });
    } catch (error: any) {
      this.logger.error(`Email send failed: ${error.message}`);
      throw error;
    }
  }
}
