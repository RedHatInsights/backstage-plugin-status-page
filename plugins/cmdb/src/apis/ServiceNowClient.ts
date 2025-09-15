import { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';
import {
  ServiceNowApi,
  ServiceNowCMDBResponse,
  ServiceNowInfraResponse,
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
  private readonly cmdbCiRelTableName = 'cmdb_rel_ci';

  constructor(
    private discoveryApi: DiscoveryApi,
    private fetchApi: FetchApi,
  ) {}

  private async getBaseUrl() {
    return `${await this.discoveryApi.getBaseUrl('proxy')}/cmdb/api/now/table/`;
  }

  async getBusinessApplication(appCode: string) {
    const apiUrl = new URL(this.cmdbTableName, await this.getBaseUrl());
    apiUrl.searchParams.append('sysparm_query', `u_application_id=${appCode}`);

    const response = await this.fetchApi.fetch(apiUrl.toString());

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

    const response = await this.fetchApi.fetch(apiUrl.toString());

    if (response.status >= 400 && response.status < 600) {
      throw new Error('Failed to fetch user details');
    }

    return (await response.json()) as ServiceNowUserResponse;
  }

  async getInfraDetails(appCode: string) {
    const apiUrl = new URL(
      `${this.cmdbCiRelTableName}`,
      await this.getBaseUrl(),
    );
    apiUrl.searchParams.append(
      'sysparm_query',
      `parent.u_business_app.u_application_idSTARTSWITH${appCode}^type.nameSTARTSWITHHosted on::Hosts^GROUPBYchild.name`,
    );
    apiUrl.searchParams.append(
      'sysparm_fields',
      'parent.name,parent.sys_class_name,u_display,child.name,sys_updated_on',
    );
    const response = await this.fetchApi.fetch(apiUrl.toString());
    if (response.status >= 400 && response.status < 600) {
      throw new Error('Failed to fetch user details');
    }

    return (await response.json()) as ServiceNowInfraResponse;
  }
}
