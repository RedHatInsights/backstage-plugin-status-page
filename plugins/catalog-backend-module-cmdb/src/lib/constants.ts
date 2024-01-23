/* Annotations */
export const ANNOTATION_CMDB_ID = 'servicenow.com/sysId';
export const ANNOTATION_CMDB_APPCODE = 'servicenow.com/appcode';
/* Relations */
export const RELATION_INHERITS = 'inherits';
export const RELATION_INHERITED_BY = 'inheritedBy';
export const RELATION_DELEGATE_OF = 'delegateOf';
export const RELATION_DELEGATED_TO = 'delegatedTo';

export const DEFAULT_CMDB_QUERY_SIZE = 100;
export const CMDB_TABLE_NAME = 'cmdb_ci_business_app';
export const CMDB_IMPORT_TAG = 'imported-from:cmdb';
export const DEFAULT_CMDB_RECORD_FIELDS = [
  'sys_id',
  'name',
  'short_description',
  'owned_by.user_name',
  'owned_by.active',
  'install_status',
  'business_criticality',
  'application_type',
  'data_classification',
  'life_cycle_stage.name',
  'life_cycle_stage_status.name',
  'support_group',
  'url',
  'sys_updated_on',
] as const;

export const PROCESSOR_CACHE_INVALIDATION_PERIOD = 15 * 60 * 1000;    // 15 minutes
