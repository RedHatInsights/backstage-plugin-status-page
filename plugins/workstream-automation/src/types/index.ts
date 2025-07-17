import { EntityLink, UserEntity } from '@backstage/catalog-model';

export interface TJiraProject {
  key: string;
  name: string;
}

export type Member = {
  userRef: string;
  role: string;
  manager?: string;
  email?: string;
};

export type Workstream = {
  name?: string;
  title?: string;
  description?: string;
  pillar?: string;
  portfolio?: string[];
  lead?: string;
  members?: Member[];
  jiraProject?: string;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
  createdBy?: string;
  links?: EntityLink[];
  art?: string;
};

export type ART = {
  name?: string;
  title?: string;
  description?: string;
  pillar?: string;
  workstreams?: string[];
  rte?: string;
  members?: Member[];
  jiraProject?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  links?: EntityLink[];
};

export interface CustomUserEntity extends UserEntity {
  spec: UserEntity['spec'] & {
    manager?: string;
  };
}

export interface TableRowDataType {
  user: CustomUserEntity;
  role?: string;
}
