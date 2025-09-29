export interface AccessReviewSummary {
  app_name: string;
  app_owner: string;
  app_delegate: string;
  cmdb_id?: string;
  environment?: string;
  jira_project?: string;
  frequency: string;
  period: string;
  reviewPeriod: {
    startDate: string;
    endDate: string;
  };
  reviewedBy: string;
  reviewScope: string;
  statusOverview: {
    totalReviews: MetricChange;
    rejections: MetricChange;
  };
  actionTypes: ActionType[];
  documentation: DocumentationItem[];
  outstandingItems: OutstandingItem[];
  auditorNotes: AuditorNote[];
  statistics?: StatisticsData;
  jira_key?: string;
  epic_key?: string;
  epic_title?: string;
  epic_created_at?: string;
  epic_created_by?: string;
  progress: 'in_progress' | 'completed';
}

export interface MetricChange {
  before: number;
  after: number;
  change: number;
  status: 'improvement' | 'decline' | 'neutral' | 'complete';
}

export interface ActionType {
  type: string;
  count: number;
  description: string;
}

export interface DocumentationItem {
  text: string;
  status: 'complete' | 'pending';
}

export interface OutstandingItem {
  item: string;
  owner: string;
  eta: string;
  remarks: string;
}

export interface AuditorNote {
  text: string;
  status: 'complete' | 'pending';
}

export interface StatisticsData {
  group_access: {
    rover: {
      total: number;
      fresh: number;
      approved: number;
      rejected: number;
      pending: number;
      changes: {
        added: number;
        removed: number;
        modified: number;
      };
      accounts?: string[];
    };
    gitlab: {
      total: number;
      fresh: number;
      approved: number;
      rejected: number;
      pending: number;
      changes: {
        added: number;
        removed: number;
        modified: number;
      };
      accounts?: string[];
    };
    ldap: {
      total: number;
      fresh: number;
      approved: number;
      rejected: number;
      pending: number;
      changes: {
        added: number;
        removed: number;
        modified: number;
      };
      accounts?: string[];
    };
  };
  service_accounts: {
    rover: {
      total: number;
      fresh: number;
      approved: number;
      rejected: number;
      pending: number;
      changes: {
        added: number;
        removed: number;
        modified: number;
      };
      accounts?: string[];
    };
    gitlab: {
      total: number;
      fresh: number;
      approved: number;
      rejected: number;
      pending: number;
      changes: {
        added: number;
        removed: number;
        modified: number;
      };
      accounts?: string[];
    };
    ldap: {
      total: number;
      fresh: number;
      approved: number;
      rejected: number;
      pending: number;
      changes: {
        added: number;
        removed: number;
        modified: number;
      };
      accounts?: string[];
    };
  };
  statusOverview: {
    totalReviews: {
      before: number;
      after: number;
      change: number;
      approved: number;
      rejected: number;
      pending: number;
      status: string;
    };
  };
}

export interface SummaryReportProps {
  data: AccessReviewSummary;
  isLoading?: boolean;
  error?: string;
  onGenerateSummary?: () => Promise<void>;
  jira_key?: string;
  epic_key?: string;
  epic_title?: string;
  isAuditCompleted?: boolean;
  isSyncing?: boolean;
  onAuditCompleted?: () => void;
}

export type StatusColor =
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral'
  | 'improvement'
  | 'decline';

export interface ReviewDataItem {
  user_id: string;
  full_name: string;
  environment: string;
  user_role: string;
  manager_name: string;
  updated_at: string;
  source?: string;
  type: 'group_access' | 'service_account';
  account_name?: string;
  ticket_reference?: string;
  ticket_status?: string;
  comments?: string;
  access_change_date?: string;
  sign_off_date?: string;
  sign_off_status?: string;
  created_at?: string;
  sign_off_by?: string;
}
