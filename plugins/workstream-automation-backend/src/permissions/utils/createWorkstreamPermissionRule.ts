import {
  RESOURCE_TYPE_WORKSTREAM_ENTITY,
  WorkstreamEntity,
} from '@compass/backstage-plugin-workstream-automation-common';
import { makeCreatePermissionRule } from '@backstage/plugin-permission-node';

export const createWorkstreamPermissionRule = makeCreatePermissionRule<
  WorkstreamEntity,
  { key: string; value: string },
  typeof RESOURCE_TYPE_WORKSTREAM_ENTITY
>();
