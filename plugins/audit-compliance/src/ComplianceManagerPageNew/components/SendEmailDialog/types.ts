export interface SendEmailDialogProps {
  open: boolean;
  onClose: () => void;
  applications: Application[];
  onEmailSent: () => void;
}

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
