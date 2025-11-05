/**
 * Constants for Soundcheck MCP Actions
 */

// Plugin ID for authentication and discovery
export const SOUNDCHECK_PLUGIN_ID = 'soundcheck';

// Check states
export const CHECK_STATES = {
  PASSED: 'passed',
  FAILED: 'failed',
  WARNING: 'warning',
  NOT_APPLICABLE: 'not-applicable',
} as const;

// Aggregation types
export const AGGREGATION_TYPES = {
  INDIVIDUAL_CHECK_PASS_RATES: 'individualCheckPassRates',
  OVERALL_CHECK_PASS_RATES: 'overallCheckPassRates',
  INDIVIDUAL_ENTITIES_PASS_RATES: 'individualEntitiesPassRates',
  OVERALL_ENTITY_PASS_RATES: 'overallEntityPassRates',
  INDIVIDUAL_TRACKS_PASS_RATES: 'individualTracksPassRates',
  OVERALL_TRACK_PASS_RATES: 'overallTrackPassRates',
  GROUPS_PASS_RATES: 'groupsPassRates',
} as const;

// Resource types
export const RESOURCE_TYPES = {
  CHECKS: 'checks',
  CHECK: 'check',
  TRACKS: 'tracks',
  TRACK: 'track',
} as const;
