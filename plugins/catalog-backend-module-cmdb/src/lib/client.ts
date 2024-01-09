import { Logger } from 'winston';
import { CMDBRecord, PagedResponse, SNowIntegrationConfig } from './types';
import { DEFAULT_CMDB_QUERY_SIZE, CMDB_TABLE_NAME, DEFAULT_CMDB_RECORD_FIELDS } from './constants';

export type CommonListOptions = {
  [key: string]: string | number | boolean | undefined;
  sysparm_fields?: string;
  sysparm_limit?: number;
  sysparm_offset?: number;
};

export class SNowClient {
  private readonly config: SNowIntegrationConfig;
  private readonly logger: Logger;

  constructor(options: { config: SNowIntegrationConfig; logger: Logger }) {
    this.config = options.config;
    this.logger = options.logger;
  }

  async getBusinessApplications(sysparmQuery: string, options?: CommonListOptions) {
    const uri = `/api/now/table/${CMDB_TABLE_NAME}`;
    const sysparm_fields = options?.sysparm_fields?.split?.(',') ?? [];

    return this.pagedRequest<CMDBRecord>(uri, {
      ...options,
      sysparm_query: sysparmQuery,
      sysparm_fields: [...DEFAULT_CMDB_RECORD_FIELDS, ...sysparm_fields].join(','),
    });
  }

  async pagedRequest<T = any>(
    endpoint: string,
    options?: CommonListOptions,
  ): Promise<PagedResponse<T>> {
    const request = new URL(endpoint, this.config.apiBaseUrl);

    const { sysparm_limit = DEFAULT_CMDB_QUERY_SIZE, sysparm_offset = 0 } =
      options ?? {};

    for (const key in options) {
      if (Boolean(options[key])) {
        request.searchParams.append(key, options[key]!.toString());
      }
    }

    this.logger.debug(`Fetching: ${request.toString()}`);
    const response = await fetch(
      request.toString(),
      getSNowRequestOptions(this.config),
    );

    if (!response.ok) {
      throw new Error(
        `Unexpected response when fetching ${request.toString()}. Expected 200 but got ${
          response.status
        } - ${response.statusText}`,
      );
    }

    return response.json().then(({ result }) => {
      const totalCount = Number.parseInt(
        response.headers.get('x-total-count') ?? '0',
        10,
      );
      const isLastPage = sysparm_offset + result.length >= totalCount;
      const nextOffset = !isLastPage
        ? sysparm_offset + sysparm_limit
        : undefined;

      return {
        items: result,
        nextOffset,
      };
    });
  }
}

export async function* paginated<T = any>(
  request: (options: CommonListOptions) => Promise<PagedResponse<T>>,
  options: CommonListOptions,
) {
  let res;
  do {
    res = await request(options);
    options.sysparm_offset = res.nextOffset;

    for (const item of res.items) {
      yield item;
    }
  } while (res.nextOffset);
}

export function getSNowRequestOptions({ credentials }: SNowIntegrationConfig): {
  headers: Record<string, string>;
} {
  const token = btoa(`${credentials?.username}:${credentials?.password}`);
  return {
    headers: {
      Authorization: `Basic ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  };
}
