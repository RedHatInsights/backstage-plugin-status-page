/**
 * Action input and output types
 */

import { CHECK_STATES } from '../utils/constants';

export type ActionErrorResponse = {
  isError: true;
  error: string;
};

export type ActionSuccessResponse<T> = {
  isError?: false;
} & T;

export type ActionResponse<T> = ActionSuccessResponse<T> | ActionErrorResponse;

export type ListSoundcheckInput = {
  type: 'checks' | 'check' | 'tracks' | 'track';
  id?: string;
  entityRef?: string;
  onlyApplicableChecks?: boolean;
  tracks?: string[];
};

export type GetSoundcheckResultsInput = {
  entityRef: string;
  checkIds?: string[];
  scope?: string;
  state?: 'passed' | 'failed' | 'warning' | 'not-applicable';
};

export type GetSoundcheckAggregationsInput = {
  type: string;
  numberOfDays?: number;
  entityKinds?: string[];
  entityTypes?: string[];
  entityLifecycles?: string[];
  tracks?: string[];
  checkIds?: string[];
  entityRefs?: string[];
};

export type CheckState = typeof CHECK_STATES[keyof typeof CHECK_STATES];

