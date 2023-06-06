import { DiscoveryApi } from '@backstage/core-plugin-api';
import {
  ServiceNowApi,
  ServiceNowCMDBResponse,
  ServiceNowUserResponse,
} from './ServiceNowApi';

/**
 * A client for fetching service information from ServiceNow CMDB table
 *
 * @public
 */
export class ServiceNowClient implements ServiceNowApi {
  private readonly cmdbTableName = 'cmdb_ci_business_app';
  private readonly userTableName = 'sys_user';

  constructor(private discoveryApi: DiscoveryApi) {}

  private async getBaseUrl() {
    return `${await this.discoveryApi.getBaseUrl('proxy')}/cmdb/api/now/table/`;
  }

  async getBusinessApplication(appCode: string) {
    const apiUrl = new URL(this.cmdbTableName, await this.getBaseUrl());
    apiUrl.searchParams.append('sysparm_query', `u_application_id=${appCode}`);

    const response = await fetch(apiUrl.toString());

    if (response.status >= 400 && response.status < 600) {
      throw new Error('Failed to fetch application details');
    }

    return (await response.json()) as ServiceNowCMDBResponse;
  }

  async getUserDetails(userId: string) {
    const apiUrl = new URL(
      `${this.userTableName}/${userId}`,
      await this.getBaseUrl(),
    );

    const response = await fetch(apiUrl.toString());

    if (response.status >= 400 && response.status < 600) {
      throw new Error('Failed to fetch user details');
    }

    return (await response.json()) as ServiceNowUserResponse;
  }
}
