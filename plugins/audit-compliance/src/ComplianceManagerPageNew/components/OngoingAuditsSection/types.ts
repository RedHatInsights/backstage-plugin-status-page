export interface Application {
  id: string;
  app_name: string;
  app_owner: string;
  app_owner_email?: string;
  cmdb_id: string;
}

export interface AuditInfo {
  app_name: string;
  frequency: string;
  period: string;
  status: string;
  progress?: string;
  jira_key?: string;
  epic_key?: string;
  epic_title?: string;
  epic_created_at?: string;
  epic_created_by?: string;
  created_at: string;
}

export interface OngoingAuditsSectionProps {
  applications: Application[];
  refreshTrigger?: number;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
}

export interface AppAuditSummary {
  app: Application;
  audits: AuditInfo[];
  totalAudits: number;
  inProgressCount: number;
  completedCount: number;
  statusSummary: string;
}
