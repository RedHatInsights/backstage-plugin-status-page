import express from 'express';
import { NotAllowedError } from '@backstage/errors';
import { HttpAuthService } from '@backstage/backend-plugin-api';
import { Knex } from 'knex';
import { Permission } from '@backstage/plugin-permission-common';
import { CustomAuthorizer } from '../types/permissions';

/**
 * Normalize app names like the backend routes: lowercase and replace spaces with hyphens.
 */
export function normalizeAppName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Resolve app_name from request params/body or by looking up applications.id.
 * Throws NotAllowedError if application context is required but missing/ambiguous.
 */
export async function resolveAppName(knex: Knex, req: express.Request): Promise<string> {
  if (req.params?.app_name) return normalizeAppName(req.params.app_name);
  if (req.body && typeof req.body.app_name === 'string') {
    return normalizeAppName(req.body.app_name);
  }

  // Array payload with app_name in each item
  if (Array.isArray(req.body) && req.body.length > 0) {
    const candidates = new Set(
      req.body
        .filter((x: any) => typeof x?.app_name === 'string')
        .map((x: any) => normalizeAppName(x.app_name)),
    );
    if (candidates.size === 1) return [...candidates][0];
    throw new NotAllowedError('Mixed or missing application context in payload');
  }

  // Look up by applications/:id routes
  if (req.params?.id && req.path.startsWith('/applications/')) {
    const row = await knex('applications')
      .select('app_name')
      .where({ id: Number(req.params.id) })
      .first();
    if (row?.app_name) return row.app_name;
  }

  throw new NotAllowedError('Application context (app_name) is required');
}

/**
 * Extract the requester identity (user entity ref) using Backstage httpAuth.
 */
export async function getRequesterIdentity(
  httpAuth: HttpAuthService,
  req: express.Request,
): Promise<string> {
  const credentials = await httpAuth.credentials(req);
  const userRef = (credentials.principal as any)?.userEntityRef ?? '';
  return userRef;
}

/**
 * Direct permission check for a specific app using roles stored in app_user_roles
 * and role -> permission mapping provided via configuration.
 */
export async function hasPermissionForApp(options: {
  knex: Knex;
  appName: string;
  username: string;
  requiredPermission: string;
  permissionsByRole: Record<string, string[]>;
}): Promise<boolean> {
  const { knex, appName, username, requiredPermission, permissionsByRole } = options;
 // console.log('hasPermissionForApp', knex, appName, username, requiredPermission, permissionsByRole);
  if (!username) return false;

  const rows = await knex('app_user_roles')
    .select('role_name')
    .where({ app_name: appName, username });

  if (rows.length === 0) return false;

  const granted = new Set<string>();
  for (const r of rows) {
    const list = permissionsByRole[r.role_name] ?? [];
    for (const p of list) granted.add(p);
  }
  return granted.has(requiredPermission);
}

/**
 * Wrapper to enforce an app-scoped permission using the Backstage permission client.
 * Throws NotAllowedError on DENY.
 */
export async function requireAppPermission(params: {
  permissions: CustomAuthorizer;
  httpAuth: HttpAuthService;
  knex: Knex;
  req: express.Request;
  permission: Permission;
}): Promise<void> {
  const { permissions, httpAuth, knex, req, permission } = params;
  const credentials = await httpAuth.credentials(req);
  const appName = await resolveAppName(knex, req);
  const [decision] = await permissions.authorize(
    [
      {
        permission,
        resourceRef: `application:default/${appName}`,
      },
    ],
    { credentials },
  );
  if (decision.result !== 'ALLOW') {
    throw new NotAllowedError('Unauthorized');
  }
}

