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
    lead?: string;
    portfolio: string[];
  };
}

export interface WorkstreamEntity extends Entity {
  apiVersion: 'workstreams/v1';
  kind: 'Workstream';
  metadata: {
    name: string;
    title?: string;
    namespace: string;
    description?: string;
    links: EntityLink[];
    annotations: Record<string, any>;
    updatedAt: string;
    updatedBy: string;
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
    lead?: string;
    portfolio: string[];
    art?: string;
  };
}

export interface ArtEntity extends Entity {
  apiVersion: 'workstreams/v1';
  kind: 'Art';
  metadata: {
    name: string;
    title?: string;
    namespace: string;
    description?: string;
    links: EntityLink[];
    annotations: Record<string, any>;
    updatedAt: string;
    updatedBy: string;
    createdBy: string;
    createdAt: string;
    artId: string;
  };
  spec: {
    members: {
      userRef: string;
      role: string;
    }[];
    pillar?: string;
    rte: string;
    workstreams: string[];
  };
}

export type UserNotes = {
  userRef: string;
  note: string;
  updatedAt: string;
  modificationHistory?: {
    timestamp: string;
    modifiedBy: string;
  }[];
};
