export interface Application {
  id: string;
  app_name: string;
  app_owner: string;
  cmdb_id: string;
}

export interface AuditInfo {
  app_name: string;
  frequency: string;
  period: string;
  status: string;
  progress?: string;
  jira_key?: string;
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
