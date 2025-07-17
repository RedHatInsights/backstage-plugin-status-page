import { Entity, EntityLink } from '@backstage/catalog-model';
import { z } from 'zod/v4';
import { UserNoteSchema } from './schemas';

/**
 * @deprecated Use {@link WorkstreamEntity} instead
 */
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
  kind: 'ART';
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

export type UserNote = z.infer<typeof UserNoteSchema>;
