import { Entity } from '@backstage/catalog-model';
import { JIRA_PROJECT_KEY_ANNOTATION } from '../hooks';

export const isJiraAvailable = (entity: Entity) =>
  Boolean(entity?.metadata.annotations?.[JIRA_PROJECT_KEY_ANNOTATION]);
