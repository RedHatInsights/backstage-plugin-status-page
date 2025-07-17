import { WorkstreamEntity } from '@compass/backstage-plugin-workstream-automation-common';
import { CustomUserEntity, TableRowDataType, TJiraProject } from '../../types';
import { GroupEntity } from '@backstage/catalog-model';

export type ARTForm1 = {
  artName: string | undefined;
  description?: string;
  rte?: CustomUserEntity;
  pillar?: string;
  email?: string;
  jiraProject?: TJiraProject;
  slackChannelUrl?: string;
  workstreams: WorkstreamEntity[];
};

export type ARTForm2 = {
  kind: { label: string; value: string } | null;
  searchQuery: CustomUserEntity | GroupEntity | null;
  selectedMembers: TableRowDataType[];
};
