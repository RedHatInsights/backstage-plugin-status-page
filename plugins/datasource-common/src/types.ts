import { Entity, EntityMeta, ResourceEntity } from '@backstage/catalog-model';
import { ExistsIn, RhDataClassifications } from './schema/openapi';

export type DatasourceEntity = Entity & {
  apiVersion: 'resource/v1alpha1';
  kind: 'Resource';
  metadata: EntityMeta & {
    annotations: {
      'compass.redhat.com/ai-related': 'true' | 'false';
    };
    namespace: string;
    datasourceId?: string;
  };
  spec: ResourceEntity['spec'] & {
    steward: string;
    usage: string;
    location: string;
    classification: RhDataClassifications;
    existsIn: Array<ExistsIn>;
  };
};
