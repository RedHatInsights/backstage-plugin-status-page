import {
  ReaderFactory,
  ReadUrlResponseFactory,
} from '@backstage/backend-defaults/urlReader';
import {
  AuthService,
  DiscoveryService,
  LoggerService,
  UrlReaderService,
  UrlReaderServiceReadTreeResponse,
  UrlReaderServiceReadUrlOptions,
  UrlReaderServiceReadUrlResponse,
  UrlReaderServiceSearchResponse,
} from '@backstage/backend-plugin-api';
import { NotFoundError, NotModifiedError } from '@backstage/errors';
import fetch, { Response } from 'node-fetch';

export class WorkstreamUrlReader implements UrlReaderService {
  private static auth: AuthService;
  private static baseUrl: string;

  public static async getFactory(
    auth: AuthService,
    discoveryApi: DiscoveryService,
  ) {
    this.auth = auth;
    this.baseUrl = await discoveryApi.getBaseUrl('workstream');
    return WorkstreamUrlReader.factory;
  }

  public static readonly factory: ReaderFactory = options => {
    const { logger } = options;
    return [
      {
        reader: new WorkstreamUrlReader(logger),
        predicate: (url: URL) => {
          const urlPattern = /^https?:\/\/[^\/]+\/api\/workstream\/[^\/]+$/;
          return (
            url.toString().includes(WorkstreamUrlReader.baseUrl) ||
            urlPattern.test(url.toString())
          );
        },
      },
    ];
  };

  private logger: LoggerService;
  constructor(logger: LoggerService) {
    this.logger = logger.child({ name: 'WorkstreamUrlReader' });
  }

  async read(url: string): Promise<Buffer> {
    const response = await this.readUrl(url);
    return response.buffer();
  }

  async readUrl(
    url: string,
    _options?: UrlReaderServiceReadUrlOptions,
  ): Promise<UrlReaderServiceReadUrlResponse> {
    this.logger.info(`Reading ${url}`);
    let response: Response;
    try {
      const { token } = await WorkstreamUrlReader.auth.getPluginRequestToken({
        onBehalfOf: await WorkstreamUrlReader.auth.getOwnServiceCredentials(),
        targetPluginId: 'workstream',
      });
      response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
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
