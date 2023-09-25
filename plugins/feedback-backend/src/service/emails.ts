import { Config } from '@backstage/config';
import { Transporter, createTransport } from 'nodemailer';
import { Logger } from 'winston';

export class NodeMailer {
  private readonly transportConfig: Transporter;
  private readonly from: string;

  constructor(config: Config, private logger: Logger) {
    this.transportConfig = createTransport({
      host: config.getString('feedback.integrations.email.host'),
      port: config.getOptionalNumber('feedback.integrations.email.port') ?? 547,
      secure:
        config.getOptionalBoolean('feedback.integrations.email.secure') ??
        false,
      auth:
        {
          user: config.getOptionalString(
            'feedback.integrations.email.auth.user',
          ),
          pass: config.getOptionalString(
            'feedback.integrations.email.auth.password',
          ),
        } ?? undefined,
      tls: {
        rejectUnauthorized: false,
      },
    });
    this.from = config.getString('feedback.integrations.email.from');
  }

  async sendMail(options: {
    to: string;
    replyTo: string;
    subject: string;
    body: string;
  }): Promise<{}> {
    const { to, replyTo, subject, body } = options;
    this.logger.info(`Sending mail to ${to}`);
    const resp = await this.transportConfig.sendMail({
      to: to,
      replyTo: replyTo,
      cc: replyTo,
      from: this.from,
      subject: subject,
      html: body,
    });
    return resp;
  }
}
