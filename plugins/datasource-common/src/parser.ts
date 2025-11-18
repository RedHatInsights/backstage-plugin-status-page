import z from 'zod';
import {
  CreateDatasource,
  DataStoreNames,
  ExistsIn,
  RhDataClassifications,
} from './schema/openapi';

const RhDataClassificationsSchema: z.ZodSchema<RhDataClassifications> = z.enum([
  'RH-Public',
  'RH-Internal',
  'RH-Restricted',
  'RH-Restricted(+PII)',
]);

export const DataStoreNameSchema: z.ZodSchema<DataStoreNames> = z.enum([
  'GraphQL',
  'XE S3 Bucket',
  'Starburst',
  'Dataverse',
  'Data Warehouse',
]);

export const ExistsInSchema: z.ZodSchema<ExistsIn> = z.object({
  name: DataStoreNameSchema,
  description: z.string().optional(),
});

export const createDatasourceParser: z.ZodSchema<CreateDatasource> = z.object({
  name: z.string().describe("Unique identifier for the datasource"),
  title: z.string().describe("Human-readable title"),
  namespace: z.string().describe("Namespace for organization"),
  description: z.string().describe("Detailed description"),
  aiRelated: z.enum(['true', 'false']).describe("Whether datasource is AI-related ('true' or 'false')"),
  owner: z.string().describe("Entity reference of the owner"),
  steward: z.string().describe("Entity reference of the data steward"),
  type: z.string().describe("Type of datasource (e.g., 'database', 's3-bucket')"),
  usage: z.string().describe("Description of datasource usage"),
  location: z.string().describe("Physical or cloud location"),
  classification: RhDataClassificationsSchema.describe("Data classification (RH-Public, RH-Internal, RH-Restricted, RH-Restricted(+PII))"),
  existsIn: z.array(ExistsInSchema).describe("List of data stores where datasource exists"),
  system: z.string().describe("Associated system reference").optional(),
  dependencyOf: z.array(z.string()).describe("Entities that depend on this datasource").optional(),
  dependsOn: z.array(z.string()).describe("Datasources this entity depends on").optional(),
  cmdbAppCode: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export const stringifyDatasourceRef = (ref: {
  namespace: string;
  name: string;
}) => {
  return `${ref.namespace}/${ref.name}`;
};

/**
 * @param target - string, in format: "namespace/name"
 */
export const parseDatasourceRef = (target: string) => {
  const [namespace, name] = target.split('/');
  return { namespace, name };
};
