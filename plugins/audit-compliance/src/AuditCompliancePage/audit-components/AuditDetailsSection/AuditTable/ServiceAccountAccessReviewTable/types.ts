export interface ServiceAccountData {
  id: number;
  user_id: string;
  application_name: string;
  app_name: string;
  environment: string;
  role: string;
  user_role: string;
  manager: string;
  manager_uid?: string;
  app_delegate: string;
  sign_off_status: 'approved' | 'rejected' | 'pending';
  sign_off_by: string;
  sign_off_date: string;
  ticket_reference?: string;
  ticket_status?: string;
  comments?: string;
  date_of_access_revoked?: string;
  revoked_date?: string;
  created_at: string;
  updated_at: string;
  service_account: string;
  account_name?: string;
  tableData?: any;
  period?: string;
  frequency?: string;
  source?: string;
}

export interface AuditTableProps {
  frequency: string;
  period: string;
  app_name: string | undefined;
  isFinalSignedOff?: boolean;
  isAuditCompleted?: boolean;
}

export interface ReviewCounts {
  completed: number;
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface AuditTablePropsWithCounts extends AuditTableProps {
  setCounts?: (counts: ReviewCounts) => void;
}
