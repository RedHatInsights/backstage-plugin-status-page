import express from 'express';
import { Knex } from 'knex';
import { LoggerService, HttpAuthService } from '@backstage/backend-plugin-api';
import { hasPermissionForApp } from './authz';
import { AuditComplianceDatabase } from '../database/AuditComplianceDatabase';

// Define permissions for each role - this maps to what each role can do
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  'compliance_manager': [
    'manage_roles', 
    'view_roles', 
    'audit_access', 
    'delete_data',
    'view_audit_summary',
    'update_audit_metadata', 
    'initiate_audits',
    'manage_jira',
    'send_emails',
    'view_audit_details'
  ],
  'app_owner': [
    'manage_roles', 
    'view_roles', 
    'audit_access',
    'view_audit_summary',
    'update_audit_metadata',
    'initiate_audits', 
    'manage_jira',
    'send_emails',
    'view_audit_details'
  ],
  'delegate': [
    'view_roles', 
    'audit_access',
    'view_audit_summary',
    'view_audit_details'
  ],
  'application_user': [
    'view_roles',
    'view_audit_summary',
    'view_audit_details'
  ],
};

export interface RbacCheckResult {
  hasPermission: boolean;
  username?: string;
  userRoles?: string[];
}

/**
 * Centralized RBAC permission checker for all routes
 */
export async function checkRbacPermission(options: {
  req: express.Request;
  appName: string;
  requiredPermission: string;
  knex: Knex;
  httpAuth?: HttpAuthService;
  logger: LoggerService;
  rbacEnabled?: boolean;
}): Promise<RbacCheckResult> {
  const { req, appName, requiredPermission, knex, httpAuth, logger, rbacEnabled = true } = options;
  if (!rbacEnabled) {
    logger.info(`[RBAC] RBAC disabled, allowing ${requiredPermission} for ${appName}`);
    return { hasPermission: true };
  }

  try {
    const credentials = httpAuth ? await httpAuth.credentials(req) : null;
    const userEntityRef = credentials?.principal ? (credentials.principal as any)?.userEntityRef : null;
    const username = userEntityRef.split('/').pop();

    if (!username) {
      logger.warn(`[RBAC] No username found in credentials for ${appName}:${requiredPermission}`);
      return { hasPermission: false };
    }

    // Get user's roles for this app
    const userRoles = await knex('app_user_roles')
      .select('role_name')
      .where({ app_name: appName, username })
      .pluck('role_name');


    console.log('userRoles', userRoles);
    console.log('requiredPermission', requiredPermission);
    const hasPermission = await hasPermissionForApp({
      knex,
      appName,
      username,
      requiredPermission,
      permissionsByRole: ROLE_PERMISSIONS,
    });

    logger.info(`[RBAC] Permission check: ${username} on ${appName} for ${requiredPermission} = ${hasPermission}`, {
      userRoles,
      requiredPermission,
    });

    return { hasPermission, username, userRoles };
  } catch (error) {
    logger.error(`[RBAC] Error checking permission: ${error}`, {
      appName,
      requiredPermission,
      error: error instanceof Error ? error.message : String(error),
    });
    return { hasPermission: false };
  }
}

/**
 * Validate that an application exists before performing operations
 */
export async function validateAppExists(appName: string, database: AuditComplianceDatabase): Promise<boolean> {
  const appDetails = await database.getApplicationDetails(appName);
  return appDetails !== null;
}

/**
 * Standard error response for insufficient permissions
 */
export function createPermissionDeniedResponse(
  requiredPermission: string,
  username?: string,
  userRoles?: string[]
): object {
  const allowedRolesForPermission = Object.entries(ROLE_PERMISSIONS)
    .filter(([, permissions]) => permissions.includes(requiredPermission))
    .map(([role]) => role);

  return {
    success: false,
    error: `Insufficient permissions for ${requiredPermission}. Required role: ${allowedRolesForPermission.join(' or ')}.`,
    requiredPermission,
    currentUser: username,
    currentUserRoles: userRoles,
    allowedRoles: allowedRolesForPermission,
  };
}

/**
 * Standard error response for app not found
 */
export function createAppNotFoundResponse(appName: string): object {
  return {
    success: false,
    error: `Application '${appName}' does not exist. Please create and onboard the application first.`,
    suggestion: `Use the applications API to create and onboard '${appName}' before performing this operation.`,
  };
}

/**
 * Generic RBAC middleware function that can be used to replace requireAppPermission
 * This handles app validation, permission checking, and returns appropriate responses
 */
export async function requireCustomPermission(options: {
  req: express.Request;
  res: express.Response;
  appName: string;
  requiredPermission: string;
  knex: Knex;
  database: any;
  httpAuth?: HttpAuthService;
  logger: LoggerService;
  rbacEnabled?: boolean;
}): Promise<{ allowed: boolean; username?: string }> {
  const { req, res, appName, requiredPermission, knex, database, httpAuth, logger, rbacEnabled = true } = options;

  try {
    const normalizedAppName = typeof appName === 'string' ? appName : appName;

    // Validate app exists
    const appExists = await validateAppExists(normalizedAppName, database);
    if (!appExists) {
      res.status(404).json(createAppNotFoundResponse(normalizedAppName));
      return { allowed: false };
    }

    // Check RBAC permissions
    const rbacCheck = await checkRbacPermission({
      req,
      appName: normalizedAppName,
      requiredPermission,
      knex,
      httpAuth,
      logger,
      rbacEnabled,
    });

    if (!rbacCheck.hasPermission) {
      res.status(403).json(createPermissionDeniedResponse(requiredPermission, rbacCheck.username, rbacCheck.userRoles));
      return { allowed: false };
    }

    return { allowed: true, username: rbacCheck.username };
  } catch (error) {
    logger.error(`[RBAC] Error in requireCustomPermission: ${error}`);
    res.status(500).json({
      success: false,
      error: 'Internal server error during permission check',
    });
    return { allowed: false };
  }
}