import { RESOURCE_TYPE_WORKSTREAM_ENTITY } from '@appdev-platform/backstage-plugin-workstream-automation-common';
import { createConditionExports } from '@backstage/plugin-permission-node';
import { workstreamPermissionRules } from '../rules';

const { conditions, createConditionalDecision } = createConditionExports({
  pluginId: 'workstream',
  resourceType: RESOURCE_TYPE_WORKSTREAM_ENTITY,
  rules: workstreamPermissionRules,
});

export const workstreamConditions = conditions;
export const createWorkstreamConditionalDecision = createConditionalDecision;
