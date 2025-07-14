import {
  ANNOTATION_LOCATION,
  ANNOTATION_ORIGIN_LOCATION,
  entityKindSchemaValidator,
  KindValidator,
} from '@backstage/catalog-model';
import { ART, Workstream } from '../../types';
import { ANNOTATION_JIRA_PROJECT_KEY } from './constants';
import {
  ArtEntity,
  WorkstreamEntity,
} from '@compass/backstage-plugin-workstream-automation-common';

export function ajvCompiledJsonSchemaValidator(schema: unknown): KindValidator {
  let validator: undefined | ((data: unknown) => any);
  return {
    async check(data) {
      if (!validator) {
        validator = entityKindSchemaValidator(schema);
      }
      return validator(data) === data;
    },
  };
}

export function artToEntityKind(options: {
  data: ART;
  location: string;
  namespace: string;
}): ArtEntity {
  const { data, location, namespace } = options;
  return {
    apiVersion: 'workstreams/v1',
    kind: 'ART',
    metadata: {
      name: data.name,
      title: data.title,
      namespace: namespace,
      ...(data.description && { description: data.description }),
      createdAt: data.createdAt ?? new Date().toISOString(),
      updatedAt: data.updatedAt ?? new Date().toISOString(),
      createdBy: data.createdBy,
      updatedBy: data.updatedBy,
      annotations: {
        [ANNOTATION_LOCATION]: location,
        [ANNOTATION_ORIGIN_LOCATION]: location,
        ...(data.jiraProject
          ? { [ANNOTATION_JIRA_PROJECT_KEY]: data.jiraProject }
          : null),
      },
      artId: data.artId,
      links: data.links,
    },
    spec: {
      members: data.members,
      rte: data.rte ?? '',
      workstreams: data.workstreams,
      pillar: data.pillar,
    },
  };
}

export function workstreamToEntityKind(options: {
  data: Workstream;
  location: string;
  namespace: string;
}): WorkstreamEntity {
  const { data, location, namespace } = options;
  return {
    apiVersion: 'workstreams/v1',
    kind: 'Workstream',
    metadata: {
      name: data.name,
      title: data.title,
      namespace: namespace,
      ...(data.description && { description: data.description }),
      createdAt: data.createdAt ?? new Date().toISOString(),
      updatedAt: data.updatedAt ?? new Date().toISOString(),
      createdBy: data.createdBy,
      updatedBy: data.updatedBy,
      workstreamId: data.workstreamId,
      annotations: {
        [ANNOTATION_LOCATION]: location,
        [ANNOTATION_ORIGIN_LOCATION]: location,
        ...(data.jiraProject
          ? { [ANNOTATION_JIRA_PROJECT_KEY]: data.jiraProject }
          : null),
      },
      links: data.links,
    },
    spec: {
      members: data.members,
      pillar: data.pillar,
      portfolio: data.portfolio,
      lead: data.lead,
      ...(data.art && { art: data.art }),
    },
  };
}
