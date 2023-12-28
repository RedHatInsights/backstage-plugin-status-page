export const CMDB_ID_ANNOTATION = 'servicenow.com/sysId';
export const CMDB_APPCODE_ANNOTATION = 'servicenow.com/appcode';
export const DEFAULT_CMDB_QUERY_SIZE = 100;
export const CMDB_TABLE_NAME = 'cmdb_ci_business_app';
export const CMDB_IMPORT_TAG = 'imported-from:cmdb';
export const DEFAULT_CMDB_RECORD_FIELDS = [
  'sys_id',
  'name',
  'short_description',
  'install_status',
  'owned_by.user_name',
  'url',
  'sys_updated_on',
] as const;
export const RELATION_INHERITS = 'inherits';
export const RELATION_INHERITED_BY = 'inheritedBy';
export const RELATION_DELEGATE_OF = 'delegateOf';
export const RELATION_DELEGATED_TO = 'delegatedTo';
