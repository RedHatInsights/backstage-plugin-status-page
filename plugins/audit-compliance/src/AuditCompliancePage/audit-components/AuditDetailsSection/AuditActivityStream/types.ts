export type EventType =
  | 'ACCESS_APPROVED'
  | 'ACCESS_REVOKED'
  | 'AUDIT_INITIATED'
  | 'AUDIT_COMPLETED'
  | 'AUDIT_SUMMARY_GENERATED'
  | 'AUDIT_PROGRESS_UPDATED'
  | 'AUDIT_FINAL_SIGNOFF_COMPLETED';

export interface AuditEvent {
  id: number;
  event_type: EventType;
  event_name?: string; // For backward compatibility
  app_name: string;
  frequency?: string;
  period?: string;
  user_id?: string;
  performed_by: string;
  performed_at?: string; // For backward compatibility
  source?: string;
  account_name?: string;
  event_data?: {
    user_id?: string;
    reviewer?: string;
    full_name?: string;
    [key: string]: any;
  };
  metadata?: {
    reason?: string;
    previous_status?: string;
    new_status?: string;
    previous_progress?: string;
    new_progress?: string;
    jira_key?: string;
    [key: string]: any;
  };
  created_at: string;
}

export interface Props {
  key?: string;
  app_name: string;
  frequency: string;
  period: string;
}
