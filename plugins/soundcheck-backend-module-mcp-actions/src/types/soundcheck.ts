/**
 * Soundcheck domain types
 * Based on official Soundcheck API schema: https://backstage.spotify.com/docs/plugins/soundcheck/api
 */

export type SoundcheckItem = {
  id: string;
  name?: string;
  title?: string;
  [key: string]: any;
};

/**
 * Check Result Schema
 * Represents the result of a check execution against an entity
 */
export type CheckResult = {
  entityRef: string;
  checkId: string;
  state: 'passed' | 'failed' | 'warning' | 'not-applicable';
  timestamp: string;
  scope?: string;
  details?: {
    notes?: {
      type?: string;
      version?: number;
      data: string;
    };
  };
  [key: string]: any;
};

export type CheckSummary = {
  total: number;
  passed: number;
  failed: number;
  warning: number;
  notApplicable: number;
};

/**
 * Inclusion Filter Schema
 * Used to include or exclude items from aggregations
 */
export type InclusionFilter = {
  included?: string | string[];
  excluded?: string | string[];
};

/**
 * Aggregation Track Filter
 * Specifies which tracks and levels to include in aggregation
 */
export type AggregationTrackFilter = {
  trackId: string;
  levels?: number[];
};

/**
 * Aggregation Filter Schema
 * Used to filter aggregation results
 * Based on: https://backstage.spotify.com/docs/plugins/soundcheck/api#aggregation-filter-schema
 */
export type AggregationFilter = {
  entityRefs?: InclusionFilter;
  checkIds?: InclusionFilter;
  tracks?: AggregationTrackFilter[];
  scope?: string;
  numberOfDays?: number;
  entityKinds?: InclusionFilter;
  entityLifecycles?: InclusionFilter;
  entityTypes?: InclusionFilter;
  checkOwnerFilters?: InclusionFilter;
  entityOwnerFilters?: InclusionFilter;
};

/**
 * Aggregation Request Schema
 */
export type AggregationRequest = {
  type: 
    | 'individualCheckPassRates'
    | 'overallCheckPassRates'
    | 'individualEntitiesPassRates'
    | 'overallEntityPassRates'
    | 'individualTracksPassRates'
    | 'overallTrackPassRates'
    | 'groupsPassRates';
  filter?: AggregationFilter;
};

/**
 * Soundcheck API Response wrapper
 */
export type SoundcheckResponse<T> = {
  checks?: T[];
  check?: T;
  tracks?: T[];
  track?: T;
  results?: T[];
  [key: string]: any;
};
