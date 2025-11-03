import {
  DatasourceAiRelatedEnum,
  RhDataClassifications,
} from '../schema/openapi/generated/models';

export type DbDatasourceRow = {
  id: string;
  name: string;
  title: string;
  namespace: string;
  description?: string;
  type: string;
  owner: string;
  steward: string;
  usage: string;
  location: string;
  existsIn: string;
  system?: string;
  dependencyOf: string;
  dependsOn: string;
  aiRelated: DatasourceAiRelatedEnum;
  classification: RhDataClassifications;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
};
