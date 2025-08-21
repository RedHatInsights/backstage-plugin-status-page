import { Knex } from 'knex';

export type AuditRole =
  | 'application_user'
  | 'app_owner'
  | 'delegate'
  | 'compliance_manager';

export class RbacRepository {
  private readonly db: Knex;

  constructor(knex: Knex) {
    this.db = knex;
  }

  async assign(appName: string, username: string, role: AuditRole, createdBy: string = 'system'): Promise<void> {
    await this.db('app_user_roles')
      .insert({ app_name: appName, username, role_name: role, created_by: createdBy })
      .onConflict(['app_name', 'username', 'role_name'])
      .ignore();
  }

  async remove(appName: string, username: string, role: AuditRole): Promise<number> {
    return this.db('app_user_roles')
      .where({ app_name: appName, username, role_name: role })
      .delete();
  }

  async listRolesFor(appName: string, username: string): Promise<AuditRole[]> {
    const rows = await this.db('app_user_roles')
      .select('role_name')
      .where({ app_name: appName, username });
    return rows.map(r => r.role_name as AuditRole);
  }

  async listAppsAndRolesForUser(username: string): Promise<Array<{
    app_name: string;
    roles: Array<{
      role_name: AuditRole;
      created_by: string;
      created_at: string;
      updated_by?: string;
      updated_at?: string;
    }>;
  }>> {
    const rows = await this.db('app_user_roles')
      .select('app_name', 'role_name', 'created_by', 'created_at', 'updated_by', 'updated_at')
      .where({ username })
      .orderBy(['app_name', 'role_name']);

    // Group by app_name
    const appMap: Record<string, Array<{
      role_name: AuditRole;
      created_by: string;
      created_at: string;
      updated_by?: string;
      updated_at?: string;
    }>> = {};

    for (const row of rows) {
      if (!appMap[row.app_name]) {
        appMap[row.app_name] = [];
      }
      appMap[row.app_name].push({
        role_name: row.role_name as AuditRole,
        created_by: row.created_by,
        created_at: row.created_at,
        updated_by: row.updated_by,
        updated_at: row.updated_at,
      });
    }

    return Object.entries(appMap).map(([app_name, roles]) => ({
      app_name,
      roles,
    }));
  }
}

