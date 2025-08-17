import { JsonObject } from '@backstage/types';

/**
 * Types used across operations files
 */

// Account types for application operations
export type AccountType = 'service-account' | 'rover-group-name';
export type AccountSource = 'rover' | 'gitlab' | 'ldap';

// Event types for activity stream operations
export type EventType =
  | 'ACCESS_APPROVED'
  | 'ACCESS_REVOKED'
  | 'AUDIT_INITIATED'
  | 'AUDIT_COMPLETED'
  | 'AUDIT_SUMMARY_GENERATED'
  | 'AUDIT_FINAL_SIGNOFF_COMPLETED'
  | 'AUDIT_PROGRESS_UPDATED'
  | 'APPLICATION_CREATED'
  | 'APPLICATION_UPDATED';

// Audit progress types
export type AuditProgress =
  | 'audit_started'
  | 'details_under_review'
  | 'final_sign_off_done'
  | 'summary_generated'
  | 'completed';

// Jira issue types
export type JiraIssueType = 'Task' | 'Epic';

// Content type constants
export const CONTENT_TYPE_JSON = 'application/json';
export const CONTENT_TYPE_ACCEPT = 'application/json';

// Operation result types
export type OperationResult =
  | 'update'
  | 'insert'
  | 'created_ticket'
  | 'updated'
  | 'error';

// Service account access review status
export type SignOffStatus = 'approved' | 'rejected' | 'pending';
