import {
  RESOURCE_TYPE_WORKSTREAM_ENTITY,
  WorkstreamDataV1alpha1,
} from '@appdev-platform/backstage-plugin-workstream-automation-common';
import { makeCreatePermissionRule } from '@backstage/plugin-permission-node';

export const createWorkstreamPermissionRule = makeCreatePermissionRule<
  WorkstreamDataV1alpha1,
  { key: string; value: string },
  typeof RESOURCE_TYPE_WORKSTREAM_ENTITY
>();
