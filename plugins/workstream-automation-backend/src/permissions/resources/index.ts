import { createPermissionResourceRef } from '@backstage/plugin-permission-node';
import {
  ArtEntity,
  RESOURCE_TYPE_ART_ENTITY,
  RESOURCE_TYPE_USER_REF,
  RESOURCE_TYPE_WORKSTREAM_ENTITY,
  WorkstreamEntity,
} from '@compass/backstage-plugin-workstream-automation-common';

export const artPermissionResourceRef = createPermissionResourceRef<
  ArtEntity,
  { key: string; value: string }
>().with({
  pluginId: 'workstream',
  resourceType: RESOURCE_TYPE_ART_ENTITY,
});

export const workstreamPermissionResourceRef = createPermissionResourceRef<
  WorkstreamEntity,
  { key: string; value: string }
>().with({
  pluginId: 'workstream',
  resourceType: RESOURCE_TYPE_WORKSTREAM_ENTITY,
});

export const userNotePermissionResourceRef = createPermissionResourceRef<
  string,
  string
>().with({
  pluginId: 'workstream',
  resourceType: RESOURCE_TYPE_USER_REF,
});
