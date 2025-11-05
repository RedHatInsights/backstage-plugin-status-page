import { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';

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
  review_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuditEntry {
  id: string;
  cmdbAppId: string;
  ldapCommonName: string;
  roverLink: string;
  responsibleParty: string;
  directlyUsedBy: string[];
  stillRequired: boolean;
  auditCompleted: boolean;
  usageNotes: string;
  reviewDate?: string;
  app_name?: string;
  application_owner?: string;
  updatedAt?: string;
}

export class SystemAuditApi {
  constructor(
    private readonly discoveryApi: DiscoveryApi,
    private readonly fetchApi: FetchApi,
  ) {}

  private async getBaseUrl(): Promise<string> {
    return await this.discoveryApi.getBaseUrl('system-audit');
  }

  /**
   * Transform backend entry to frontend entry format
   */
  private transformEntry(entry: SystemAuditEntry): AuditEntry {
    // Handle directly_used_by - it might be an array, JSON string, or plain string
    let directlyUsedBy: string[] = [];
    if (Array.isArray(entry.directly_used_by)) {
      directlyUsedBy = entry.directly_used_by;
    } else if (typeof entry.directly_used_by === 'string') {
      try {
        // Try to parse as JSON array
        directlyUsedBy = JSON.parse(entry.directly_used_by);
      } catch {
        // If parsing fails, treat as a single value and wrap in array
        directlyUsedBy = entry.directly_used_by.trim()
          ? [entry.directly_used_by]
          : [];
      }
    }

    return {
      id: entry.id?.toString() || '',
      cmdbAppId: entry.cmdb_app_id || '',
      ldapCommonName: entry.ldap_common_name,
      roverLink: entry.rover_link || '',
      responsibleParty: entry.responsible_party || '',
      directlyUsedBy,
      stillRequired: entry.still_required ?? true,
      auditCompleted: entry.audit_cleanup_completed ?? false,
      usageNotes: entry.usage_notes || '',
      reviewDate: entry.review_date || undefined,
      app_name: entry.app_name,
      application_owner: entry.application_owner,
      updatedAt: entry.updated_at || undefined,
    };
  }

  /**
   * Transform frontend entry to backend entry format
   */
  private transformToBackendEntry(
    entry: Partial<AuditEntry>,
  ): Partial<SystemAuditEntry> {
    const result: Partial<SystemAuditEntry> = {};

    if (entry.cmdbAppId !== undefined) result.cmdb_app_id = entry.cmdbAppId;
    if (entry.ldapCommonName !== undefined)
      result.ldap_common_name = entry.ldapCommonName;
    if (entry.roverLink !== undefined) result.rover_link = entry.roverLink;
    if (entry.responsibleParty !== undefined)
      result.responsible_party = entry.responsibleParty;
    if (entry.directlyUsedBy !== undefined)
      result.directly_used_by = entry.directlyUsedBy;
    if (entry.stillRequired !== undefined)
      result.still_required = entry.stillRequired;
    if (entry.auditCompleted !== undefined)
      result.audit_cleanup_completed = entry.auditCompleted;
    if (entry.usageNotes !== undefined) result.usage_notes = entry.usageNotes;
    if (entry.app_name !== undefined) result.app_name = entry.app_name;
    if (entry.application_owner !== undefined)
      result.application_owner = entry.application_owner;
    if (entry.reviewDate !== undefined) result.review_date = entry.reviewDate;

    return result;
  }

  async getAllEntries(): Promise<AuditEntry[]> {
    const baseUrl = await this.getBaseUrl();
    const response = await this.fetchApi.fetch(`${baseUrl}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch entries: ${response.statusText}`);
    }

    const data = await response.json();
    return (data.entries || []).map((entry: SystemAuditEntry) =>
      this.transformEntry(entry),
    );
  }

  async getEntryById(id: number): Promise<AuditEntry | null> {
    const baseUrl = await this.getBaseUrl();
    const response = await this.fetchApi.fetch(`${baseUrl}/${id}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch entry: ${response.statusText}`);
    }

    const data = await response.json();
    return this.transformEntry(data.entry);
  }

  async createEntry(entry: Omit<AuditEntry, 'id'>): Promise<AuditEntry> {
    const baseUrl = await this.getBaseUrl();
    const backendEntry = this.transformToBackendEntry(entry);

    const response = await this.fetchApi.fetch(`${baseUrl}/create-entry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendEntry),
    });

    if (!response.ok) {
      throw new Error(`Failed to create entry: ${response.statusText}`);
    }

    const data = await response.json();
    return this.transformEntry(data.entry);
  }

  async updateEntry(
    id: number,
    entry: Partial<AuditEntry>,
  ): Promise<AuditEntry> {
    const baseUrl = await this.getBaseUrl();
    const backendEntry = this.transformToBackendEntry(entry);

    const response = await this.fetchApi.fetch(`${baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendEntry),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Entry not found');
      }
      throw new Error(`Failed to update entry: ${response.statusText}`);
    }

    const data = await response.json();
    return this.transformEntry(data.entry);
  }

  async deleteEntry(id: number): Promise<void> {
    const baseUrl = await this.getBaseUrl();
    const response = await this.fetchApi.fetch(`${baseUrl}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Entry not found');
      }
      throw new Error(`Failed to delete entry: ${response.statusText}`);
    }
  }
}
