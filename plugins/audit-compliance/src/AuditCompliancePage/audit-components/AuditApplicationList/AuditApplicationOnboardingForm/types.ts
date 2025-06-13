export type AccountEntry = {
  type: 'service-account' | 'rover-group-name';
  source: 'rover' | 'gitlab';
  account_name: string;
};

export type ApplicationFormData = {
  app_name: string;
  cmdb_id: string;
  environment: string;
  app_owner: string;
  app_delegate: string;
  jira_project: string;
  accounts: AccountEntry[];
};

export interface AuditApplicationOnboardingFormProps {
  onSuccess?: () => void;
}
