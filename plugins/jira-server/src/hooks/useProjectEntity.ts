import { Entity } from '@backstage/catalog-model';

export const JIRA_PROJECT_KEY_ANNOTATION = 'jira/project-key';
const JIRA_BEARER_TOKEN_ANNOTATION = 'jira/token-type';
const JIRA_COMPONENT_ANNOTATION = 'jira/component';
const JIRA_LABEL_ANNOTATION = 'jira/label';

export const useProjectEntity = (entity: Entity) => {
  return {
    projectKey: entity.metadata?.annotations?.[
      JIRA_PROJECT_KEY_ANNOTATION
    ] as string,
    component: entity.metadata?.annotations?.[
      JIRA_COMPONENT_ANNOTATION
    ] as string,
    tokenType: entity.metadata?.annotations?.[
      JIRA_BEARER_TOKEN_ANNOTATION
    ] as string,
    label: entity.metadata?.annotations?.[JIRA_LABEL_ANNOTATION] as string,
  };
};
