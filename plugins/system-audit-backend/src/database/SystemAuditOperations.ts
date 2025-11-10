import { Knex } from 'knex';
import { LoggerService } from '@backstage/backend-plugin-api';

export interface SystemAuditEntry {
  id?: number;
  cmdb_app_id?: string;
  ldap_common_name: string;
  rover_link?: string;
  responsible_party?: string;
  directly_used_by?: string[] | string;
  still_required?: boolean;
  audit_cleanup_completed?: boolean;
  usage_notes?: string;
  app_name?: string;
  application_owner?: string;
  review_date?: string | Date;
  created_at?: Date;
  updated_at?: Date;
}

export class SystemAuditOperations {
  constructor(
    private readonly knex: Knex,
    private readonly logger: LoggerService,
  ) {}

  async getAllEntries(): Promise<SystemAuditEntry[]> {
    try {
      const entries = await this.knex('system_audit')
        .select('*')
        .orderBy('created_at', 'desc');

      return entries.map(this.parseEntry);
    } catch (error) {
      this.logger.error(
        'Error fetching all entries:',
        error instanceof Error ? error : new Error(String(error)),
      );
      throw error;
    }
  }

  async getEntryById(id: number): Promise<SystemAuditEntry | null> {
    try {
      const entry = await this.knex('system_audit').where({ id }).first();

      return entry ? this.parseEntry(entry) : null;
    } catch (error) {
      this.logger.error(
        `Error fetching entry with id ${id}:`,
        error instanceof Error ? error : new Error(String(error)),
      );
      throw error;
    }
  }

  async createEntry(
    data: Omit<SystemAuditEntry, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<SystemAuditEntry> {
    try {
      const entryData = {
        cmdb_app_id: data.cmdb_app_id || null,
        ldap_common_name: data.ldap_common_name,
        rover_link: data.rover_link || null,
        responsible_party: data.responsible_party || null,
        directly_used_by: Array.isArray(data.directly_used_by)
          ? JSON.stringify(data.directly_used_by)
          : data.directly_used_by || null,
        still_required: data.still_required ?? true,
        audit_cleanup_completed: data.audit_cleanup_completed ?? false,
        usage_notes: data.usage_notes || null,
        app_name: data.app_name || null,
        application_owner: data.application_owner || null,
        review_date:
          data.review_date === '' ||
          !data.review_date ||
          data.review_date === 'NA'
            ? null
            : data.review_date,
        created_at: this.knex.fn.now(),
        updated_at: this.knex.fn.now(),
      };

      const result = await this.knex('system_audit')
        .insert(entryData)
        .returning('*');

      // returning('*') returns an array of the inserted rows
      if (!Array.isArray(result) || result.length === 0) {
        throw new Error('Failed to create entry - no result returned');
      }

      return this.parseEntry(result[0]);
    } catch (error) {
      this.logger.error(
        'Error creating entry:',
        error instanceof Error ? error : new Error(String(error)),
      );
      throw error;
    }
  }

  async updateEntry(
    id: number,
    data: Partial<SystemAuditEntry>,
  ): Promise<SystemAuditEntry | null> {
    try {
      const updateData: any = {
        updated_at: this.knex.fn.now(),
      };

      if (data.cmdb_app_id !== undefined)
        updateData.cmdb_app_id = data.cmdb_app_id;
      if (data.ldap_common_name !== undefined)
        updateData.ldap_common_name = data.ldap_common_name;
      if (data.rover_link !== undefined)
        updateData.rover_link = data.rover_link;
      if (data.responsible_party !== undefined)
        updateData.responsible_party = data.responsible_party;
      if (data.directly_used_by !== undefined) {
        updateData.directly_used_by = Array.isArray(data.directly_used_by)
          ? JSON.stringify(data.directly_used_by)
          : data.directly_used_by;
      }
      if (data.still_required !== undefined)
        updateData.still_required = data.still_required;
      if (data.audit_cleanup_completed !== undefined)
        updateData.audit_cleanup_completed = data.audit_cleanup_completed;
      if (data.usage_notes !== undefined)
        updateData.usage_notes = data.usage_notes;
      if (data.app_name !== undefined) updateData.app_name = data.app_name;
      if (data.application_owner !== undefined)
        updateData.application_owner = data.application_owner;
      if (data.review_date !== undefined) {
        // Convert empty string or 'NA' to null for date fields
        updateData.review_date =
          data.review_date === '' ||
          data.review_date === null ||
          data.review_date === 'NA'
            ? null
            : data.review_date;
      }

      const updated = await this.knex('system_audit')
        .where({ id })
        .update(updateData);

      if (updated === 0) {
        return null;
      }

      return await this.getEntryById(id);
    } catch (error) {
      this.logger.error(
        `Error updating entry with id ${id}:`,
        error instanceof Error ? error : new Error(String(error)),
      );
      throw error;
    }
  }

  async deleteEntry(id: number): Promise<boolean> {
    try {
      const deleted = await this.knex('system_audit').where({ id }).delete();

      return deleted > 0;
    } catch (error) {
      this.logger.error(
        `Error deleting entry with id ${id}:`,
        error instanceof Error ? error : new Error(String(error)),
      );
      throw error;
    }
  }

  private parseEntry(entry: any): SystemAuditEntry {
    let directlyUsedBy = entry.directly_used_by;
    if (typeof directlyUsedBy === 'string') {
      try {
        // Try to parse as JSON array
        directlyUsedBy = JSON.parse(directlyUsedBy);
      } catch {
        // If parsing fails, treat as a single value and wrap in array
        directlyUsedBy = directlyUsedBy.trim() ? [directlyUsedBy] : [];
      }
    } else if (!Array.isArray(directlyUsedBy)) {
      // If it's neither string nor array, default to empty array
      directlyUsedBy = [];
    }

    return {
      ...entry,
      directly_used_by: directlyUsedBy,
    };
  }
}
