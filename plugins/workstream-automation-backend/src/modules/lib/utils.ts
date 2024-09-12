import {
  ANNOTATION_LOCATION,
  ANNOTATION_ORIGIN_LOCATION,
  entityKindSchemaValidator,
  KindValidator,
} from '@backstage/catalog-model';
import { Workstream } from '../../types';
import { ANNOTATION_JIRA_PROJECT_KEY } from './constants';
import { WorkstreamDataV1alpha1 } from '@appdev-platform/backstage-plugin-workstream-automation-common';

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

export function workstreamToEntityKind(options: {
  data: Workstream;
  location: string;
  namespace: string;
}): WorkstreamDataV1alpha1 {
  const { data, location, namespace } = options;
  return {
    apiVersion: 'console.one.redhat.com/v1alpha1',
    kind: 'Workstream',
    metadata: {
      name: data.name,
      title: data.title,
      namespace: namespace,
      description: data.description,
      createdAt: data.createdAt ?? new Date().toISOString(),
      updatedAt: data.updatedAt ?? new Date().toISOString(),
      createdBy: data.createdBy,
      workstreamId: data.workstreamId,
      annotations: {
        [ANNOTATION_LOCATION]: location,
        [ANNOTATION_ORIGIN_LOCATION]: location,
        ...(data.jiraProject
          ? { [ANNOTATION_JIRA_PROJECT_KEY]: data.jiraProject }
          : null),
      },
      links: [
        ...(data.email
          ? [
              {
                url: `mailto://${data.email}`,
                title: 'Email',
                icon: 'mail',
              },
            ]
          : []),
        ...(data.slackChannelUrl
          ? [
              {
                url: data.slackChannelUrl,
                title: 'Slack',
                icon: 'slack_contact',
              },
            ]
          : []),
      ],
    },
    spec: {
      members: data.members,
      pillar: data.pillar,
      portfolio: data.portfolio,
      lead: data.lead,
    },
  };
}
