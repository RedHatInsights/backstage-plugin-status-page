import { Entity, EntityMeta, ResourceEntity } from '@backstage/catalog-model';

type RhDataClassifications =
  | 'RH-Public'
  | 'RH-Internal'
  | 'RH-Restricted'
  | 'RH-Restricted(+PII)';

type DataStoreNames =
  | 'GraphQL'
  | 'XE S3 Bucket'
  | 'Starburst'
  | 'Dataverse'
  | 'Data Warehouse';

export type DatasourceEntity = Entity & {
  apiVersion: 'resource/v1alpha1';
  kind: 'Resource';
  metadata: EntityMeta & {
    annotations: {
      'compass.redhat.com/ai-related': 'true' | 'false';
    };
  };
  spec: ResourceEntity['spec'] & {
    steward: string;
    usage: string;
    location: string;
    classification: RhDataClassifications;
    existsIn: {
      name: DataStoreNames;
      description?: string;
    }[];
  };
};
