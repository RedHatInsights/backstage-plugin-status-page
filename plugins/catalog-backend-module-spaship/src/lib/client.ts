import { LoggerService } from '@backstage/backend-plugin-api';
import { SPAship, SPAshipIntegrationConfig } from './types';
import { pick, omit } from 'lodash';

export type CommonListOptions = {
  [key: string]: string | number | boolean | undefined;
};

export class SPAshipClient {
  private readonly config: SPAshipIntegrationConfig;
  private readonly logger: LoggerService;

  constructor(options: { config: SPAshipIntegrationConfig; logger: LoggerService }) {
    this.config = options.config;
    this.logger = options.logger;
  }

  async getProperties(
    options?: CommonListOptions,
  ): Promise<SPAship.Property[]> {
    const uri = `/api/v1/property`;

    return this.request<SPAship.Property>(uri, {
      ...options,
    });
  }

  async getApplications(
    propertyIdentifier: string,
    options?: CommonListOptions,
  ): Promise<SPAship.Application[]> {
    const uri = `/api/v1/applications/property/${propertyIdentifier}`;

    const response = await this.request<SPAship.RawApplication>(uri, {
      ...options,
    });

    return response.reduce((acc, application) => {
      const existingAppIndex = acc.findIndex(
        a => a.identifier === application.identifier,
      );

      const environmentFields = [
        'env',
        'ref',
        'routerUrl',
        'accessUrl',
      ] as const;

      if (existingAppIndex !== -1) {
        acc[existingAppIndex].environments = [
          ...acc[existingAppIndex].environments,
          ...(application.env ? [pick(application, environmentFields)] : []),
        ];
      } else {
        acc.push({
          ...omit(application, environmentFields),
          environments: (application.env ? [pick(application, environmentFields)] : []),
        });
      }

      return acc;
    }, [] as SPAship.Application[]);
  }

  async request<T = SPAship.Property | SPAship.Application>(
    endpoint: string,
    options?: CommonListOptions,
  ): Promise<T[]> {
    const request = new URL(endpoint, this.config.apiBaseUrl);

    for (const key in options) {
      if (Boolean(options[key])) {
        request.searchParams.append(key, options[key]!.toString());
      }
    }

    this.logger.debug(`Fetching: ${request.toString()}`);
    const response = await fetch(
      request.toString(),
      getSPAshipRequestOptions(this.config),
    );

    if (!response.ok) {
      throw new Error(
        `Unexpected response when fetching ${request.toString()}. Expected 200 but got ${
          response.status
        } - ${response.statusText}`,
      );
    }

    return response.json().then(({ data }) => {
      if (Array.isArray(data)) {
        return data;
      }
      return [data];
    });
  }
}

export function getSPAshipRequestOptions({
  apiKey,
}: SPAshipIntegrationConfig): {
  headers: Record<string, string>;
} {
  const token = `Bearer ${apiKey}`;
  return {
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  };
}
