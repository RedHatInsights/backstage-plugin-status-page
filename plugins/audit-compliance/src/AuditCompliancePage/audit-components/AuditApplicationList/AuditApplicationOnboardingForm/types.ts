export type AccountEntry = {
  type: 'service-account' | 'rover-group-name';
  source: 'rover' | 'gitlab' | 'ldap';
  account_name: string;
};

export type JiraMetadataArrayItem = { id: string; key: string; value: string };

export type ApplicationFormData = {
  app_name: string;
  cmdb_id: string; // Comma-separated CMDB codes
  environment: string;
  app_owner: string;
  app_owner_email: string;
  app_delegate: string;
  app_delegate_email: string;
  jira_project: string;
  accounts: AccountEntry[];
  jira_metadata?: { [key: string]: string } | JiraMetadataArrayItem[];
};

export interface AuditApplicationOnboardingFormProps {
  onSuccess?: () => void;
  initialData?: ApplicationFormData;
  isEditMode?: boolean;
}
