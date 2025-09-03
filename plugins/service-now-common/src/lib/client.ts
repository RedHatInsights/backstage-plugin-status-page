import { LoggerService } from '@backstage/backend-plugin-api';

import {
  PagedResponse,
  ServiceNowIntegrationConfig,
  CommonListOptions,
  ServiceNowComplianceControlsResponse,
  ServiceNowSIAComplianceControlsResponse,
  ServiceNowPIAAssessmentInstanceResponse,
} from './types';

import {
  CMDB_ESS_TABLE_NAME,
  DEFAULT_CMDB_QUERY_SIZE,
  CMDB_ESS_RECORD_FIELDS,
  CMDB_PIA_TABLE_NAME,
  CMDB_PIA_RECORD_FIELDS,
  CMDB_SIA_RECORD_FIELDS,
  CMDB_SIA_TABLE_NAME,
} from './constants';

/**
 * A client for interacting with the ServiceNow API.
 *
 * This class handles configuration loading, authentication setup,
 * pagination support, and management of optional request parameters
 * for ServiceNow API calls.
 */
export class ServiceNowClient {
  private readonly config: ServiceNowIntegrationConfig;
  private readonly logger: LoggerService;

  constructor(options: {
    config: ServiceNowIntegrationConfig;
    logger: LoggerService;
  }) {
    this.config = options.config;
    this.logger = options.logger;
  }

  async getComplianceControls(
    sysparmQuery: string,
    options?: CommonListOptions,
  ) {
    const uri = `/api/now/table/${CMDB_ESS_TABLE_NAME}`;
    const sysparm_fields = options?.sysparm_fields?.split?.(',') ?? [];

    return this.pagedRequest<ServiceNowComplianceControlsResponse>(uri, {
      ...options,
      sysparm_query: sysparmQuery,
      sysparm_fields: [...CMDB_ESS_RECORD_FIELDS, ...sysparm_fields].join(','),
    });
  }

  async getSIAComplianceControlsBySysId(
    sysId: string,
    options?: CommonListOptions,
  ) {
    const uri = `/api/now/table/${CMDB_SIA_TABLE_NAME}`;
    const sysparmQuery = `applies_to=${sysId}`;
    const sysparm_fields = options?.sysparm_fields?.split?.(',') ?? [];

    return this.pagedRequest<ServiceNowSIAComplianceControlsResponse>(uri, {
      ...options,
      sysparm_query: sysparmQuery,
      sysparm_fields: [...CMDB_SIA_RECORD_FIELDS, ...sysparm_fields].join(','),
    });
  }

  async getPIAAssessmentInstancesBySysId(
    sysId: string,
    options?: CommonListOptions,
  ) {
    const uri = `/api/now/v2/table/${CMDB_PIA_TABLE_NAME}`;
    const sysparmQuery = `sn_grc_profile.applies_to=${sysId}`;
    const sysparm_fields = options?.sysparm_fields?.split?.(',') ?? [];
  
    return this.pagedRequest<ServiceNowPIAAssessmentInstanceResponse>(uri, {
      ...options,
      sysparm_query: sysparmQuery,
      "metric_type.nameSTARTSWITHPrivacy": "",
      sysparm_fields: [...CMDB_PIA_RECORD_FIELDS, ...sysparm_fields].join(','),
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

export function getSNowRequestOptions({
  credentials,
}: ServiceNowIntegrationConfig): {
  headers: Record<string, string>;
} {
  // TODO: Can we use a base64 encoded token instead of this?
  const token = btoa(`${credentials?.username}:${credentials?.password}`);
  return {
    headers: {
      Authorization: `Basic ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  };
}
