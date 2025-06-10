import { EntityLink } from '@backstage/catalog-model';

export type Member = {
  userRef: string;
  role: string;
};

export type Workstream = {
  workstreamId: string;
  name: string;
  title: string;
  description?: string;
  pillar: string;
  portfolio: string[];
  lead?: string;
  members: Member[];
  jiraProject: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy: string;
  links: EntityLink[];
  updatedBy: string;
  art?: string;
};

export type ART = {
  artId: string;
  name: string;
  title: string;
  description?: string;
  pillar: string;
  workstreams: string[];
  rte?: string;
  members: Member[];
  jiraProject: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy: string;
  updatedBy: string;
  links: EntityLink[];
};
