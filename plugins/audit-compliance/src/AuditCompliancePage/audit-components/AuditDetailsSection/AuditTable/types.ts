export interface ServiceAccountData {
  id: number;
  user_id: string;
  application_name: string;
  environment: string;
  role: string;
  manager: string;
  signed_off: string;
  signed_off_by: string;
  sign_off_date: string;
  comments: string;
  jira_ticket_reference: string;
  date_of_access_revoked: string;
  created_at: string;
  updated_at: string;
  app_delegate: string;
  tableData: any;
  ticket_status: string | null;
}

export interface UserAccessData {
  id: number;
  environment: string;
  full_name: string;
  user_id: string;
  user_role: string;
  manager: string;
  sign_off_status: string;
  sign_off_by: string | null;
  sign_off_date: string | null;
  source: string;
  comments: string | null;
  ticket_reference: string | null;
  ticket_status: string | null;
  app_delegate: string | null;
  account_source?: string;
  rover_group_name: string;
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
}
