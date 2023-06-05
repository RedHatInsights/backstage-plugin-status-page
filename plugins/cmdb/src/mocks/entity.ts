import { Entity } from '@backstage/catalog-model';

export const mockEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'Example Application',
    annotations: {
      'servicenow.com/appcode': 'APP-001',
    },
  },
};
