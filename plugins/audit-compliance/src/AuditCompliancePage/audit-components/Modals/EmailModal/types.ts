export interface UserAccessData {
  id: number;
  environment: string;
  full_name: string;
  user_id: string;
  user_role: string;
  manager: string;
  signed_off: string;
  sign_off_done_by: string | null;
  date_of_sign_off: string | null;
  git_rover_both: string;
  comments: string | null;
  ticket_id: string | null;
  date_of_access_revoked_added: string | null;
  ticket_status: string | null;
  manager_uid?: string;
  app_owner_email?: string;
}

export interface UserProfile {
  displayName?: string;
}

export interface UserEntity {
  spec?: {
    profile?: UserProfile;
  };
}

export interface EmailRef {
  sendEmails: () => void;
}

export interface EmailProps {
  selectedRows: UserAccessData[];
  currentUser: string;
  appName: string;
  auditPeriod: string;
  frequency: string;
  onEmailSendSuccess: () => void;
  onClose: () => void;
}
export interface EmailModalProps {
  open: boolean;
  onClose: () => void;
  selectedRows: any[];
  currentUser: string;
  onEmailSendSuccess: () => void;
  app_name: string;
  frequency: string;
  period: string;
}
