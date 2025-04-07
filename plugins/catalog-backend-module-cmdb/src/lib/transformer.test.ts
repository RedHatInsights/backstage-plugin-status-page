import { CMDBDiscoveryEntityProviderConfig, CMDBRecord } from "./types";
import { transformer } from './transformer';
import { BusinessApplicationApiVersion, CMDB_IMPORT_TAG, installStatuses } from "./constants";
import { DEFAULT_NAMESPACE } from "@backstage/catalog-model";
import { kebabCase } from "lodash";

const mockRecord: CMDBRecord = {
  sys_id: 'aadfsj897sdfajelskjndca',
  u_application_id: 'MOCK-001',
  name: 'Mock Application',
  short_description:
    'A mock business application in CMDB.',
  install_status: '1',
  business_criticality: 'C1',
  url: 'https://example.com/',
  application_type: 'homegrown',
  data_classification: 'Internal',
  'owned_by.user_name': 'guest',
  'owned_by.active': 'true',
  'life_cycle_stage_status.name': 'In Use',
  'life_cycle_stage.name': 'Operational',
  'support_group.name': '',
  sys_updated_on: '2025-03-30 00:45:14',
};

const mockProvider: CMDBDiscoveryEntityProviderConfig = {
  id: 'mock',
  host: 'example.com',
  sysparmQuery: 'sys_id=aadfsj897sdfajelskjndca'
};

describe('transformer', () => {
  it('should transform a cmdbRecord a cmdb business application', () => {
    const application = transformer(mockRecord, mockProvider);

    expect(application.apiVersion).toEqual(BusinessApplicationApiVersion);
    expect(application.kind).toEqual('BusinessApplication');
    expect(application.metadata.name).toEqual(kebabCase(mockRecord.name!.toString()));
    expect(application.metadata.namespace).toEqual(DEFAULT_NAMESPACE);
    expect(application.metadata.tags).toContain(CMDB_IMPORT_TAG);
    expect(application.metadata).toHaveProperty('cmdb');
    expect(application.metadata.sysUpdatedAt).toEqual(mockRecord.sys_updated_on);
    expect(application.metadata.links).toHaveLength(1);
    expect(application.spec?.lifecycle).toEqual(installStatuses[mockRecord.install_status?.toString()!]);
    expect(application.spec?.owner).toMatch(mockRecord["owned_by.user_name"]?.toString()!);
  });
});
