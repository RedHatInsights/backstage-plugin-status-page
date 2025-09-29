export interface Application {
  id: string;
  app_name: string;
  app_owner: string;
  cmdb_id: string;
}

export interface EmailFormData {
  to: string[];
  cc: string[];
  subject: string;
  body: string;
}

export interface AuditResult {
  app_name: string;
  frequency: string;
  period: string;
  jira_ticket: string;
  status: string;
  epic_key?: string;
}

// Interface for the raw audit data from backend
export interface RawAuditResult {
  id: number;
  application_id: string;
  app_name: string;
  frequency: string;
  period: string;
  status: string;
  reports_generated: number;
  jira_creation_failed: boolean;
  jira_ticket: {
    id: string;
    key: string;
    status: string;
    self: string;
    epic_key?: string;
    epic_title?: string;
    epic_creation_failed?: boolean;
  } | null;
  epic_details?: {
    epic_key: string;
    epic_title: string;
    epic_creation_failed: boolean;
  } | null;
}

export interface TwoStepAuditDialogProps {
  open: boolean;
  onClose: () => void;
  applications: Application[];
  selectedApplications: string[];
  frequency: 'quarterly' | 'yearly' | '';
  selectedQuarter: string;
  selectedYear: number;
  onFrequencyChange: (frequency: 'quarterly' | 'yearly' | '') => void;
  onQuarterChange: (quarter: string) => void;
  onYearChange: (year: number) => void;
  onApplicationsChange: (applicationIds: string[]) => void;
  initiating: boolean;
  getQuarterOptions: () => Array<{ value: string; label: string }>;
  getYearOptions: () => number[];
  onRefresh?: () => void;
}
