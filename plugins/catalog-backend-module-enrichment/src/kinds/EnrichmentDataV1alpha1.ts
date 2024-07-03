import { Entity } from '@backstage/catalog-model';
import { ajvCompiledJsonSchemaValidator } from '../util';
import schema from '../schema/EnrichmentData.v1alpha1.schema.json';

export interface EnrichmentDataV1alpha1 extends Entity {
  apiVersion: 'console.one.redhat.com/v1alpha1' | 'redhat.com/v1alpha1';
  kind: 'EnrichmentData';
  spec: {
    owner: string;
    selectors: {
      entityRef: string;
    }[];
    template: Pick<Entity, 'metadata' | 'spec'>;
  };
}

export const enrichmentDataV1alpha1Validator = ajvCompiledJsonSchemaValidator(schema);
