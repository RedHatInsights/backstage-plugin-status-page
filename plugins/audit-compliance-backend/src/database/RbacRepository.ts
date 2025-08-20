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
}

