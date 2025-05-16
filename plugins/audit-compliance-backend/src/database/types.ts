export interface App {
  id: string;
  name: string;
  cmdvid: string;
  service_account: string;
  created_at?: string;
}

export interface AccessReview {
  id: string;
  app_id: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Needs Info';
  last_updated?: string;
}

export interface AuditLog {
  id?: string;
  app_id: string;
  action: string;
  performed_by: string;
  timestamp?: string;
  notes?: string;
}

export interface ReviewComment {
  id?: string;
  review_id: string;
  comment: string;
  created_by: string;
  created_at?: string;
}
