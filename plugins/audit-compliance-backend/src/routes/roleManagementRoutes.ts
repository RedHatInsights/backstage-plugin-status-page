import express from 'express';
import Router from 'express-promise-router';
import { Knex } from 'knex';
import { LoggerService, RootConfigService, HttpAuthService } from '@backstage/backend-plugin-api';
import { CustomAuthorizer } from '../types/permissions';
import { normalizeAppName } from '../api/authz';
import { RbacRepository, AuditRole } from '../database/RbacRepository';
import { AuditComplianceDatabase } from '../database/AuditComplianceDatabase';
import { 
  checkRbacPermission, 
  validateAppExists, 
  createPermissionDeniedResponse, 
  createAppNotFoundResponse,
  ROLE_PERMISSIONS 
} from '../api/rbac';


const ALLOWED_ROLES: AuditRole[] = [
  'application_user',
  'app_owner',
  'delegate',
  'compliance_manager',
];

export async function createRoleManagementRouter(
  knex: Knex,
  logger: LoggerService,
  config: RootConfigService,
  _permissions?: CustomAuthorizer,
  httpAuth?: HttpAuthService,
): Promise<express.Router> {
  const router = Router();
  const repo = new RbacRepository(knex);
  const rbacEnabled = (config?.getOptionalBoolean?.('auditCompliance.rbac.enabled') ?? true) as boolean;

  // Create database instance for app validation
  const database = await AuditComplianceDatabase.create({
    knex,
    skipMigrations: true,
    logger,
    config,
  });



  // Helper function to get current roles for an app
  const getCurrentRoles = async (appName: string) => {
    const rows = await knex('app_user_roles')
      .select('role_name', 'username', 'created_by', 'created_at', 'updated_by', 'updated_at')
      .where({ app_name: appName })
      .orderBy(['role_name', 'username']);

    const byRole: Record<string, any[]> = {};
    for (const r of rows) {
      byRole[r.role_name] = byRole[r.role_name] ?? [];
      byRole[r.role_name].push(r);
    }
    return { app_name: appName, roles: byRole };
  };

  // Assign role
  router.post('/rbac/:app_name/assign', async (req, res) => {
    try {
      const appName = normalizeAppName(req.params.app_name);
      const { username, role } = req.body ?? {};

      // Check if application exists
      const appExists = await validateAppExists(appName, database);
      if (!appExists) {
        return res.status(404).json(createAppNotFoundResponse(appName));
      }

      if (!username) {
        return res.status(400).json({ 
          success: false,
          error: 'username is required' 
        });
      }
      
      if (!role) {
        return res.status(400).json({ 
          success: false,
          error: 'role is required' 
        });
      }
      
      if (!ALLOWED_ROLES.includes(role)) {
        return res.status(400).json({ 
          success: false,
          error: `Invalid role: ${role}`, 
          validRoles: ALLOWED_ROLES 
        });
      }
      // Check if user has permission to manage roles using custom RBAC
      const rbacCheck = await checkRbacPermission({
        req,
        appName,
        requiredPermission: 'manage_roles',
        knex,
        httpAuth,
        logger,
        rbacEnabled,
      });

      if (!rbacCheck.hasPermission) {
        return res.status(403).json(createPermissionDeniedResponse('manage_roles', rbacCheck.username, rbacCheck.userRoles));
      }

      const requester = httpAuth ? ((await httpAuth.credentials(req)).principal as any)?.userEntityRef ?? 'system' : 'system';
      
      // Check if role assignment already exists
      const existingRoles = await repo.listRolesFor(appName, username);
      if (existingRoles.includes(role)) {
        return res.status(409).json({
          success: false,
          error: `User ${username} already has role ${role} for app ${appName}`,
          currentRoles: existingRoles
        });
      }

      await repo.assign(appName, username, role, requester);
      logger.info(`[rbac] Assigned role ${role} to ${username} on ${appName} by ${requester}`);
      
      // Get updated roles list
      const updatedRoles = await getCurrentRoles(appName);
      
      return res.status(200).json({
        success: true,
        message: `Successfully assigned role ${role} to ${username}`,
        data: updatedRoles
      });
    } catch (error) {
      logger.error(`[rbac] Error assigning role: ${error}`);
      return res.status(500).json({
        success: false,
        error: 'Internal server error while assigning role'
      });
    }
  });

  // Remove role
  router.delete('/rbac/:app_name/roles/:role/assign', async (req, res) => {
    try {
      const appName = normalizeAppName(req.params.app_name);
      const role = req.params.role as AuditRole;
      const { username } = req.body ?? {};

      // Check if application exists
      const appExists = await validateAppExists(appName, database);
      if (!appExists) {
        return res.status(404).json(createAppNotFoundResponse(appName));
      }

      if (!ALLOWED_ROLES.includes(role)) {
        return res.status(400).json({ 
          success: false,
          error: `Invalid role: ${role}`, 
          validRoles: ALLOWED_ROLES 
        });
      }
      if (!username) {
        return res.status(400).json({ 
          success: false,
          error: 'username is required' 
        });
      }

      // Check if user has permission to manage roles using custom RBAC
      const rbacCheck = await checkRbacPermission({
        req,
        appName,
        requiredPermission: 'manage_roles',
        knex,
        httpAuth,
        logger,
        rbacEnabled,
      });

      if (!rbacCheck.hasPermission) {
        return res.status(403).json(createPermissionDeniedResponse('manage_roles', rbacCheck.username, rbacCheck.userRoles));
      }

      // Check if role assignment exists before trying to remove
      const existingRoles = await repo.listRolesFor(appName, username);
      if (!existingRoles.includes(role)) {
        return res.status(404).json({
          success: false,
          error: `User ${username} does not have role ${role} for app ${appName}`,
          currentRoles: existingRoles
        });
      }

      const deletedCount = await repo.remove(appName, username, role);
      
      if (deletedCount === 0) {
        return res.status(404).json({
          success: false,
          error: `Role assignment not found or already removed`
        });
      }

      logger.info(`[rbac] Removed role ${role} from ${username} on ${appName}`);
      
      // Get updated roles list
      const updatedRoles = await getCurrentRoles(appName);
      
      return res.status(200).json({
        success: true,
        message: `Successfully removed role ${role} from ${username}`,
        data: updatedRoles
      });
    } catch (error) {
      logger.error(`[rbac] Error removing role: ${error}`);
      return res.status(500).json({
        success: false,
        error: 'Internal server error while removing role'
      });
    }
  });

  // List members grouped by role
  router.get('/rbac/:app_name/roles', async (req, res) => {
    try {
      const appName = normalizeAppName(req.params.app_name);

      // Check if application exists
      const appExists = await validateAppExists(appName, database);
      if (!appExists) {
        return res.status(404).json(createAppNotFoundResponse(appName));
      }


      const roleData = await getCurrentRoles(appName);
      
      return res.status(200).json({
        success: true,
        message: `Successfully retrieved roles for app ${appName}`,
        data: roleData
      });
    } catch (error) {
      logger.error(`[rbac] Error retrieving roles: ${error}`);
      return res.status(500).json({
        success: false,
        error: 'Internal server error while retrieving roles'
      });
    }
  });

  // Get user's apps and roles - new endpoint for user-specific role information
  router.get('/rbac/users/:username/apps', async (req, res) => {
    try {
      const username = req.params.username;

      if (!username) {
        return res.status(400).json({ 
          success: false,
          error: 'username is required' 
        });
      }

      // Get all apps and roles for the user
      const userAppsAndRoles = await repo.listAppsAndRolesForUser(username);
      
      // Enhance with permission details
      const appsWithPermissions = userAppsAndRoles.map(appData => ({
        app_name: appData.app_name,
        roles: appData.roles.map(roleData => ({
          role_name: roleData.role_name,
          permissions: ROLE_PERMISSIONS[roleData.role_name] || [],
          created_by: roleData.created_by,
          created_at: roleData.created_at,
          updated_by: roleData.updated_by,
          updated_at: roleData.updated_at,
        })),
        // Summary of all permissions across all roles for this app
        all_permissions: [
          ...new Set(
            appData.roles.flatMap(roleData => 
              ROLE_PERMISSIONS[roleData.role_name] || []
            )
          )
        ].sort(),
      }));

      const totalApps = appsWithPermissions.length;
      const totalRoles = appsWithPermissions.reduce((sum, app) => sum + app.roles.length, 0);
      const allUniquePermissions = [
        ...new Set(
          appsWithPermissions.flatMap(app => app.all_permissions)
        )
      ].sort();

      return res.status(200).json({
        success: true,
        message: `Successfully retrieved apps and roles for user ${username}`,
        data: {
          username,
          summary: {
            total_apps: totalApps,
            total_role_assignments: totalRoles,
            unique_permissions: allUniquePermissions.length,
            all_permissions: allUniquePermissions,
          },
          apps: appsWithPermissions,
        }
      });
    } catch (error) {
      logger.error(`[rbac] Error retrieving user apps and roles: ${error}`);
      return res.status(500).json({
        success: false,
        error: 'Internal server error while retrieving user apps and roles'
      });
    }
  });

  return router;
}

