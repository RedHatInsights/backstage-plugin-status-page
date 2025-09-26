import { JsonObject } from '@backstage/types';

export interface JiraIssueStatusResponse {
  fields: {
    status: {
      name: string;
    };
  };
}

export interface JiraRequestFields extends JsonObject {
  project: { key: string };
  summary: string;
  description: string;
  issuetype: { name: string };
  labels: string[];
  assignee?: { emailAddress: string };
  customfield_12311140?: string; // Parent Epic Link
}

export interface JiraRequestBody extends JsonObject {
  fields: JiraRequestFields;
}

/**
 * Interface defining the contract for audit compliance data storage and retrieval.
 * Provides methods for managing application details, activity streams, and access reviews.
 */
export interface AuditComplianceStore {
  // Method removed from implementation - update interface accordingly
  // getAccessReviewData(appId: string, frequency: string, period: string): Promise<any[]>;
  getApplicationDetails(
    appName: string,
  ): Promise<{ source: string; account_name: string } | null>;
  getDistinctAppOwners(appName: string): Promise<string[]>;

  // Activity Stream methods
  getActivityStreamEvents(params: {
    app_name: string;
    frequency?: string;
    period?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]>;
  createActivityEvent(event: {
    event_type: string;
    app_name: string;
    frequency?: string;
    period?: string;
    user_id?: string;
    performed_by: string;
    metadata?: JsonObject;
  }): Promise<any>;

  // Add new methods for audit metadata
  getAuditMetadata(auditId: number): Promise<any>;
  updateAuditMetadata(
    auditId: number,
    metadata: {
      documentation_evidence: JsonObject;
      auditor_notes: JsonObject;
    },
  ): Promise<any>;
}

/**
 * Represents a single review data item containing user access information.
 * Used for both approved and rejected access reviews.
 */
export interface ReviewDataItem {
  user_id: string;
  full_name: string;
  environment: string;
  user_role: string;
  manager_name: string;
  updated_at: string;
  source?: string;
  type: 'group_access' | 'service_account';
}

/**
 * Represents the complete review data structure containing both approved and rejected items.
 */
export interface ReviewData {
  approved: ReviewDataItem[];
  rejected: ReviewDataItem[];
}
