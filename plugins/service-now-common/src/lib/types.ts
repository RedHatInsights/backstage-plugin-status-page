import { TaskScheduleDefinition } from '@backstage/backend-tasks';
import { Entity, EntityMeta } from '@backstage/catalog-model';
import { DEFAULT_CMDB_RECORD_FIELDS } from './constants';
import { JsonValue, JsonObject } from '@backstage/types';

export type ServiceNowIntegrationConfig = {
  host: string;
  apiBaseUrl: string;
  credentials: {
    username: string;
    password: string;
  };
};

export type EntityOverride = Partial<Pick<Entity, 'metadata' | 'spec'>>;

export type CMDBDiscoveryEntityProviderConfig = {
  /**
   * Identifier of the provider, used at the location key for ingested entities
   */
  id: string;

  /**
   * (Required) Host name of the ServiceNow instance
   */
  host: string;

  /**
   * A Query that can be executed on the CMDB Table APIs to get the entities to be processed
   */
  sysparmQuery: string;

  /**
   * Number of records to query at a time
   * @defaultValue 100
   */
  querySize?: number;

  /**
   * Map the cmdb record with entity fields
   */
  customMappings?: {
    [field: string]: string;
  };

  /**
   * Custom fields to query
   */
  additionalQueryFields?: string[];

  /**
   * Overrides to be used when composing an entity for ingestion
   */
  overrides?: EntityOverride;

  /**
   * Schedule configuration for refresh tasks
   */
  schedule?: TaskScheduleDefinition;
};

export type CommonListOptions = {
  [key: string]: string | number | boolean | undefined;
  sysparm_fields?: string;
  sysparm_limit?: number;
  sysparm_offset?: number;
};

export type PagedResponse<T> = {
  nextOffset?: number;
  items: T[];
};

type CMDBFields = (typeof DEFAULT_CMDB_RECORD_FIELDS)[number];

export type CMDBRecord = JsonObject & Record<CMDBFields, JsonValue>;

export type CMDBMeta = {
  sysId: string;
  title: string;
  ownedBy: string;
  ownedByActive: boolean;
  installStatus: string;
  businessCriticality: string;
  applicationType?: string;
  dataClassification?: string;
  lifecycleStage?: string;
  lifecycleStageStatus?: string;
  supportGroup?: string;
  urls?: Partial<{
    ess: string;
    pia: string;
    piaRemediations: string;
    risk: string;
    sia: string;
  }>;
} & JsonObject;

export interface BusinessApplicationEntity extends Entity {
  metadata: Prettify<
    EntityMeta & {
      cmdb: CMDBMeta;
    }
  >;
}

type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export interface ServiceNowComplianceControlItem {
  sys_created_on: string;
  name: string;
  sys_updated_on: string;
  state: string;
  frequency: string;
  status: string;
}

export interface ServiceNowComplianceControlsResponse {
  result: ServiceNowComplianceControlItem[];
}
export interface ServiceNowPIAComplianceControlsResponse {
  state: string;
}

export interface ServiceNowSIAComplianceControlsResponse {
  sys_created_on: string;
  name: string;
  sys_updated_on: string;
  state: string;
  expires:string;
  expiresCount:number;
}
