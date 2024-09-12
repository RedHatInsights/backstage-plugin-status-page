export type WorkstreamDatabaseModel = {
  id: string;
  name: string;
  title: string;
  portfolio: string;
  members: string;
  description?: string;
  pillar: string;
  lead: string;
  jira_project: string;
  created_by: string;
  slack_channel_url: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
};
