export interface UserAuditEntry {
  id: number;
  environment: string;
  full_name: string;
  user_id: string;
  user_role: string;
  manager: string;
  sign_off_status: 'approved' | 'rejected' | 'pending';
  sign_off_by?: string;
  sign_off_date?: string;
  source: string;
  comments?: string;
  ticket_reference?: string;
  access_change_date?: string;
  created_at?: string;
  account_name?: string;
  app_name?: string;
  frequency?: string;
  period?: string;
  app_delegate?: string;
  ticket_status?: string;
}
export interface ServiceAccountAuditEntry {
  id: number;
  app_name: string;
  environment: string;
  service_account: string;
  user_role: string;
  manager: string;
  signed_off: 'approved' | 'rejected' | 'pending';
  sign_off_by?: string;
  sign_off_date?: string;
  comments?: string;
  ticket_reference?: string;
  revoked_date?: string;
  created_at?: string;
  updated_at?: string;
  period?: string;
  frequency?: string;
  app_delegate?: string;
  ticket_status?: string;
}
