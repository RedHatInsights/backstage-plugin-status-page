export interface UserAccessData {
  id: number;
  environment: string;
  full_name: string;
  user_id: string;
  user_role: string;
  manager: string;
  manager_uid?: string;
  sign_off_status: string;
  sign_off_by: string | null;
  sign_off_date: string | null;
  source: string;
  comments: string | null;
  ticket_reference: string | null;
  ticket_status: string | null;
  app_delegate: string | null;
  account_source?: string;
  account_name: string;
  frequency?: string;
  period?: string;
  created_at?: string;
  app_name?: string;
  access_change_date: string | null;
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
