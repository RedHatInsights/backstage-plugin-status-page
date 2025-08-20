/*
 * Audit & Compliance RBAC permission definitions
 *
 * These permission constants are used by routes and the permission policy
 * to authorize access to application-scoped resources within the
 * audit-compliance backend. Most permissions are app-scoped and use the
 * resourceRef pattern `application:default/<app_name>` during authorization.
 */

import { createPermission, Permission } from '@backstage/plugin-permission-common';

// Common resource type identifier for app-scoped checks
export const AUDIT_COMPLIANCE_RESOURCE_TYPE = 'application';

// Application list / management
export const applicationCreatePermission = createPermission({
  name: 'auditCompliance.application.create',
  attributes: { action: 'create' },
});

export const applicationEditPermission = createPermission({
  name: 'auditCompliance.application.edit',
  attributes: { action: 'update' },
  resourceType: AUDIT_COMPLIANCE_RESOURCE_TYPE,
});

// Audit initiation & lifecycle
export const auditInitiatePermission = createPermission({
  name: 'auditCompliance.audit.initiate',
  attributes: { action: 'create' },
  resourceType: AUDIT_COMPLIANCE_RESOURCE_TYPE,
});

export const auditUpdatePermission = createPermission({
  name: 'auditCompliance.audit.update',
  attributes: { action: 'update' },
  resourceType: AUDIT_COMPLIANCE_RESOURCE_TYPE,
});

export const auditProgressUpdatePermission = createPermission({
  name: 'auditCompliance.audit.progress.update',
  attributes: { action: 'update' },
  resourceType: AUDIT_COMPLIANCE_RESOURCE_TYPE,
});

export const auditRefreshPermission = createPermission({
  name: 'auditCompliance.audit.refresh',
  attributes: { action: 'read' },
  resourceType: AUDIT_COMPLIANCE_RESOURCE_TYPE,
});

// Optional: explicit owner-only epic key update
export const auditUpdateJiraKeyPermission = createPermission({
  name: 'auditCompliance.audit.updateJiraKey',
  attributes: { action: 'update' },
  resourceType: AUDIT_COMPLIANCE_RESOURCE_TYPE,
});

// Audit details - bulk actions & activity
export const reviewBulkActionPermission = createPermission({
  name: 'auditCompliance.review.bulkAction',
  attributes: { action: 'update' },
  resourceType: AUDIT_COMPLIANCE_RESOURCE_TYPE,
});

export const activityCreatePermission = createPermission({
  name: 'auditCompliance.activity.create',
  attributes: { action: 'create' },
  resourceType: AUDIT_COMPLIANCE_RESOURCE_TYPE,
});

export const emailSendPermission = createPermission({
  name: 'auditCompliance.email.send',
  attributes: { action: 'create' },
  resourceType: AUDIT_COMPLIANCE_RESOURCE_TYPE,
});

// Jira-related
export const jiraCreateTicketPermission = createPermission({
  name: 'auditCompliance.jira.createTicket',
  attributes: { action: 'create' },
  resourceType: AUDIT_COMPLIANCE_RESOURCE_TYPE,
});

export const jiraAddCommentPermission = createPermission({
  name: 'auditCompliance.jira.addComment',
  attributes: { action: 'create' },
  resourceType: AUDIT_COMPLIANCE_RESOURCE_TYPE,
});

// Read-only/public-ish (kept as permissions to allow future tightening)
export const jiraFieldsPermission = createPermission({
  name: 'auditCompliance.jira.fields',
  attributes: { action: 'read' },
});

export const jiraTransformMetadataPermission = createPermission({
  name: 'auditCompliance.jira.transformMetadata',
  attributes: { action: 'read' },
});

export const searchGroupsPermission = createPermission({
  name: 'auditCompliance.search.groups',
  attributes: { action: 'read' },
});

// Summary & metadata
export const summaryViewPermission = createPermission({
  name: 'auditCompliance.summary.view',
  attributes: { action: 'read' },
  resourceType: AUDIT_COMPLIANCE_RESOURCE_TYPE,
});

export const summaryGeneratePermission = createPermission({
  name: 'auditCompliance.summary.generate',
  attributes: { action: 'create' },
  resourceType: AUDIT_COMPLIANCE_RESOURCE_TYPE,
});

export const metadataViewPermission = createPermission({
  name: 'auditCompliance.metadata.view',
  attributes: { action: 'read' },
  resourceType: AUDIT_COMPLIANCE_RESOURCE_TYPE,
});

export const metadataUpdatePermission = createPermission({
  name: 'auditCompliance.metadata.update',
  attributes: { action: 'update' },
  resourceType: AUDIT_COMPLIANCE_RESOURCE_TYPE,
});

export const auditCompletePermission = createPermission({
  name: 'auditCompliance.audit.complete',
  attributes: { action: 'update' },
  resourceType: AUDIT_COMPLIANCE_RESOURCE_TYPE,
});

// Data management (typically Compliance Manager)
export const dataDeletePermission = createPermission({
  name: 'auditCompliance.data.delete',
  attributes: { action: 'delete' },
  resourceType: AUDIT_COMPLIANCE_RESOURCE_TYPE,
});

// Helper: identify if a permission belongs to the audit-compliance namespace
export function isAuditCompliancePermission(permission: Permission): boolean {
  return permission.name.startsWith('auditCompliance.');
}

// Convenient export of all permissions as a registry
export const auditCompliancePermissions = {
  applicationCreatePermission,
  applicationEditPermission,
  auditInitiatePermission,
  auditUpdatePermission,
  auditProgressUpdatePermission,
  auditRefreshPermission,
  auditUpdateJiraKeyPermission,
  reviewBulkActionPermission,
  activityCreatePermission,
  emailSendPermission,
  jiraCreateTicketPermission,
  jiraAddCommentPermission,
  jiraFieldsPermission,
  jiraTransformMetadataPermission,
  searchGroupsPermission,
  summaryViewPermission,
  summaryGeneratePermission,
  metadataViewPermission,
  metadataUpdatePermission,
  auditCompletePermission,
  dataDeletePermission,
} as const;

