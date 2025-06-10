import { WorkstreamEntity } from '@appdev-platform/backstage-plugin-workstream-automation-common';
import { CustomUserEntity, TableRowDataType } from '../../types';
import { GroupEntity } from '@backstage/catalog-model/index';

interface TJiraProject {
  key: string;
  name: string;
}

export type ARTForm1 = {
  artName: string | undefined;
  description?: string;
  rte?: CustomUserEntity;
  pillar?: string;
  jiraProject?: TJiraProject;
  email?: string;
  slackChannelUrl?: string;
  workstreams: WorkstreamEntity[];
};

export type ARTForm2 = {
  kind: { label: string; value: string } | null;
  searchQuery: CustomUserEntity | GroupEntity | null;
  selectedMembers: TableRowDataType[];
};
