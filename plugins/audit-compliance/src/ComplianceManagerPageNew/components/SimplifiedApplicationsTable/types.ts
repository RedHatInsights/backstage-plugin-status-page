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

export interface SimplifiedApplicationsTableProps {
  applications: Application[];
  selectedApplications: string[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSelectionChange: (selectedIds: string[]) => void;
  onRefresh: () => void;
  refreshTrigger?: number;
}
