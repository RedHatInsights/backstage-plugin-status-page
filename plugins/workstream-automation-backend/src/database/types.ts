export type WorkstreamDatabaseModel = {
  id: string;
  name: string;
  title: string;
  portfolio: string;
  members: string;
  description?: string;
  pillar: string;
  lead?: string;
  jira_project: string;
  created_by: string;
  created_at?: string;
  updated_at?: string;
  updated_by?: string;
  art?: string;
  links: string;
};

export type ArtDatabaseModel = {
  id: string;
  name: string;
  title: string;
  description?: string;
  pillar: string;
  jira_project: string;
  workstreams: string;
  rte?: string;
  members: string;
  created_at?: string;
  updated_at?: string;
  created_by: string;
  updated_by: string;
  links: string;
};
