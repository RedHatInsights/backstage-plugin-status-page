/**
 * Build aggregation filter from input parameters
 * Transforms simple arrays into the official Aggregation Filter Schema format
 * https://backstage.spotify.com/docs/plugins/soundcheck/api#aggregation-filter-schema
 */

import type { AggregationFilter } from '../types';

export function buildAggregationFilter(input: {
  numberOfDays?: number;
  entityKinds?: string[];
  entityTypes?: string[];
  entityLifecycles?: string[];
  tracks?: string[];
  checkIds?: string[];
  entityRefs?: string[];
}): AggregationFilter | undefined {
  const filter: AggregationFilter = {};

  if (input.numberOfDays !== undefined) {
    filter.numberOfDays = input.numberOfDays;
  }

  if (input.entityKinds?.length) filter.entityKinds = { included: input.entityKinds };
  if (input.entityTypes?.length) filter.entityTypes = { included: input.entityTypes };
  if (input.entityLifecycles?.length) filter.entityLifecycles = { included: input.entityLifecycles };
  if (input.checkIds?.length) filter.checkIds = { included: input.checkIds };
  if (input.entityRefs?.length) filter.entityRefs = { included: input.entityRefs };
  if (input.tracks?.length) filter.tracks = input.tracks.map(trackId => ({ trackId }));

  return Object.keys(filter).length > 0 ? filter : undefined;
}

