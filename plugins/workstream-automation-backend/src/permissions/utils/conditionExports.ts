import { createConditionExports } from '@backstage/plugin-permission-node';
import {
  ArtEntity,
  RESOURCE_TYPE_ART_ENTITY,
  RESOURCE_TYPE_USER_REF,
  RESOURCE_TYPE_WORKSTREAM_ENTITY,
  WorkstreamEntity,
} from '@compass/backstage-plugin-workstream-automation-common';
import {
  artPermissionResourceRef,
  userNotePermissionResourceRef,
  workstreamPermissionResourceRef,
} from '../resources';
import {
  artPermissionRules,
  userNotePermissionRules,
  workstreamPermissionRules,
} from '../rules';

export const {
  conditions: workstreamConditions,
  createConditionalDecision: createWorkstreamConditionalDecision,
} = createConditionExports<
  typeof RESOURCE_TYPE_WORKSTREAM_ENTITY,
  WorkstreamEntity,
  typeof workstreamPermissionRules
>({
  rules: workstreamPermissionRules,
  resourceRef: workstreamPermissionResourceRef,
});

export const {
  conditions: artConditions,
  createConditionalDecision: createArtConditionalDecision,
} = createConditionExports<
  typeof RESOURCE_TYPE_ART_ENTITY,
  ArtEntity,
  typeof artPermissionRules
>({
  rules: artPermissionRules,
  resourceRef: artPermissionResourceRef,
});

export const {
  conditions: userNoteConditions,
  createConditionalDecision: createUserNoteConditionalDecision,
} = createConditionExports<
  typeof RESOURCE_TYPE_USER_REF,
  string,
  typeof userNotePermissionRules
>({
  rules: userNotePermissionRules,
  resourceRef: userNotePermissionResourceRef,
});
