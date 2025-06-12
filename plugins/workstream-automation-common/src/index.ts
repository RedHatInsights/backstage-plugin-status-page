/***/
/**
 * Common functionalities for the workstream-automation plugin.
 *
 * @packageDocumentation
 */

import { createPermission } from '@backstage/plugin-permission-common';

export const RESOURCE_TYPE_WORKSTREAM_ENTITY = 'workstream-entity';
export const RESOURCE_TYPE_ART_ENTITY = 'art-entity';

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
});

export const workstreamPermissions = [
  workstreamCreatePermission,
  workstreamDeletePermission,
  workstreamUpdatePermission,
  artCreatePermission,
  artDeletePermission,
  artUpdatePermission,
];

export * from './types';

export {
  WORKSTREAM_RELATION_PAIR,
  RELATION_LEAD_BY,
  RELATION_LEAD_OF,
} from './constants';
