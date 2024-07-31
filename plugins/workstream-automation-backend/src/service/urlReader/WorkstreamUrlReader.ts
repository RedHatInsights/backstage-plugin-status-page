import {
  ReaderFactory,
  ReadUrlResponseFactory,
} from '@backstage/backend-defaults/urlReader';
import {
  LoggerService,
  UrlReaderService,
  UrlReaderServiceReadTreeResponse,
  UrlReaderServiceReadUrlOptions,
  UrlReaderServiceReadUrlResponse,
  UrlReaderServiceSearchResponse,
} from '@backstage/backend-plugin-api';
import { NotFoundError, NotModifiedError } from '@backstage/errors';
import fetch, { Response } from 'node-fetch';
import {
  WorkstreamIntegrationConfig,
  WorkstreamIntegration,
} from '../../modules/integrations/WorkstreamIntegration';

export class WorkstreamUrlReader implements UrlReaderService {
  public static readonly factory: ReaderFactory = options => {
    const { config, logger } = options;
    const integrations = WorkstreamIntegration.fromConfig(config);
    return integrations.list().map(integration => {
      const host = integration.host;
      const [hostname, _port] = host.split(':');
      const reader = new WorkstreamUrlReader(integration, logger);
      const predicate = (url: URL) => url.hostname === hostname;
      return { reader: reader, predicate: predicate };
    });
  };

  private logger: LoggerService;
  constructor(
    private integration: WorkstreamIntegrationConfig,
    logger: LoggerService,
  ) {
    this.logger = logger.child({ name: 'WorkstreamUrlReader' });
  }

  async read(url: string): Promise<Buffer> {
    const response = await this.readUrl(url);
    return response.buffer();
  }

  async readUrl(
    url: string,
    options?: UrlReaderServiceReadUrlOptions,
  ): Promise<UrlReaderServiceReadUrlResponse> {
    this.logger.debug(`Fetching ${url.split('/').pop()}`);
    console.log(options);
    let response: Response;
    try {
      response = await fetch(url, {
        headers: {
          Authorization: this.integration.token,
        },
      });
    } catch (e) {
      throw new Error(`Unable to read ${url}, ${e}`);
    }

    if (response.status === 304) {
      throw new NotModifiedError();
    }

    if (response.ok) {
      const res = await response.json();
      return ReadUrlResponseFactory.fromNodeJSReadable(response.body, {
        lastModifiedAt: new Date(res.metadata.updatedAt),
      });
    }

    const message = `could not read ${url}, ${response.status} ${response.statusText}`;
    if (response.status === 404) {
      throw new NotFoundError(message);
    }
    throw new Error(message);
  }

  async search(): Promise<UrlReaderServiceSearchResponse> {
    throw new Error('Not Implemented');
  }

  async readTree(): Promise<UrlReaderServiceReadTreeResponse> {
    throw new Error('Not Implemented');
  }
}
