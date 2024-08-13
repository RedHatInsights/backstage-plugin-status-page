/***/
/**
 * Common functionalities for the workstream-automation plugin.
 *
 * @packageDocumentation
 */

import { createPermission } from '@backstage/plugin-permission-common';

export const RESOURCE_TYPE_WORKSTREAM_ENTITY = 'workstream-entity';

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

export const workstreamPermissions = [
  workstreamCreatePermission,
  workstreamDeletePermission,
  workstreamUpdatePermission,
];

export { type WorkstreamDataV1alpha1 } from './types';
