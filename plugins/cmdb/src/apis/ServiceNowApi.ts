import { ApiRef, createApiRef } from '@backstage/core-plugin-api';
import { BusinessApplication, InfraDetails, ServiceNowUser } from './types';

/** @public */
export const serviceNowApiRef: ApiRef<ServiceNowApi> = createApiRef({
  id: 'plugin.cmdb.service',
});

/**
 * A client for fetching service details from Service Now CMDB table
 *
 * @public
 */
export type ServiceNowApi = {
  getBusinessApplication: (appCode: string) => Promise<ServiceNowCMDBResponse>;

  getUserDetails: (userId: string) => Promise<ServiceNowUserResponse>;

  getInfraDetails: (appCode: string) => Promise<ServiceNowInfraResponse>;
};

export type ServiceNowCMDBResponse = {
  result: [BusinessApplication];
};
export type ServiceNowUserResponse = {
  result: ServiceNowUser;
};

export type ServiceNowInfraResponse = {
  result: [InfraDetails];
};
