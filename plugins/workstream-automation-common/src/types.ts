import { Entity, EntityLink } from '@backstage/catalog-model';

export interface WorkstreamDataV1alpha1 extends Entity {
  apiVersion: 'console.one.redhat.com/v1alpha1' | 'redhat.com/v1alpha1';
  kind: 'Workstream';
  metadata: {
    name: string;
    title?: string;
    namespace: string;
    description?: string;
    links: EntityLink[];
    annotations: Record<string, any>;
    updatedAt: string;
    createdBy: string;
    createdAt: string;
    workstreamId: string;
  };
  spec: {
    members: {
      userRef: string;
      role: string;
    }[];
    pillar: string;
    lead: string;
    portfolio: string[];
  };
}
