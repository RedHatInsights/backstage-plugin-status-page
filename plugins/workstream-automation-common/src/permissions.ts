import {
  createPermission,
  Permission,
} from '@backstage/plugin-permission-common';

export const RESOURCE_TYPE_WORKSTREAM_ENTITY = 'workstream-entity';
export const RESOURCE_TYPE_ART_ENTITY = 'art-entity';
export const RESOURCE_TYPE_USER_REF = 'user-ref';

export const workstreamCreatePermission = createPermission({
  name: 'workstream.create',
  attributes: { action: 'create' },
});

export const workstreamDeletePermission = createPermission({
  name: 'workstream.delete',
  attributes: { action: 'delete' },
});

export const workstreamUpdatePermission = createPermission({
  name: 'workstream.update',
  attributes: { action: 'update' },
  resourceType: RESOURCE_TYPE_WORKSTREAM_ENTITY,
});

export const artCreatePermission = createPermission({
  name: 'workstream.art.create',
  attributes: { action: 'create' },
});

export const artDeletePermission = createPermission({
  name: 'workstream.art.delete',
  attributes: { action: 'delete' },
});

export const artUpdatePermission = createPermission({
  name: 'workstream.art.update',
  attributes: { action: 'update' },
  resourceType: RESOURCE_TYPE_ART_ENTITY,
});

export const userNoteCreatePermission = createPermission({
  name: 'workstream.user.note.create',
  attributes: { action: 'create' },
  resourceType: RESOURCE_TYPE_USER_REF,
});

export const userNoteDeletePermission = createPermission({
  name: 'workstream.user.note.delete',
  attributes: { action: 'delete' },
  resourceType: RESOURCE_TYPE_USER_REF,
});

export const userNoteUpdatePermission = createPermission({
  name: 'workstream.user.note.update',
  attributes: { action: 'update' },
  resourceType: RESOURCE_TYPE_USER_REF,
});

export const workstreamPluginPermissions: Permission[] = [
  workstreamCreatePermission,
  workstreamDeletePermission,
  workstreamUpdatePermission,
  artCreatePermission,
  artDeletePermission,
  artUpdatePermission,
  userNoteCreatePermission,
  userNoteDeletePermission,
  userNoteUpdatePermission,
];
