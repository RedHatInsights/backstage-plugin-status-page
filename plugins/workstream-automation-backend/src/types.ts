export type Member = {
  userRef: string;
  role: string;
};

export type Workstream = {
  name: string;
  title: string;
  description?: string;
  pillar: string;
  portfolio: string[];
  lead: string;
  members: Member[];
  jiraProject: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy: string;
  slackChannelUrl: string;
  email: string;
};
