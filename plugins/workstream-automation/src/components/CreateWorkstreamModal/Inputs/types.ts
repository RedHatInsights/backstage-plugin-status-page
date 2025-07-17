import { GroupEntity, SystemEntity } from '@backstage/catalog-model';
import { CustomUserEntity, TableRowDataType, TJiraProject } from '../../../types';


export type Form2 = {
  kind: { label: string; value: string } | null;
  searchQuery: CustomUserEntity | GroupEntity | null;
  selectedMembers: TableRowDataType[];
};

export type Form1 = {
  workstreamName: string | undefined;
  description?: string;
  lead?: CustomUserEntity;
  pillar?: string;
  jiraProject?: TJiraProject;
  email?: string;
  slackChannelUrl?: string;
  portfolio: SystemEntity[];
};
