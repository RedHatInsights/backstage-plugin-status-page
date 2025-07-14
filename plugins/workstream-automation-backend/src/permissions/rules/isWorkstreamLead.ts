import { RESOURCE_TYPE_WORKSTREAM_ENTITY } from '@compass/backstage-plugin-workstream-automation-common';
import { createWorkstreamPermissionRule } from '../utils/createWorkstreamPermissionRule';
import { z } from 'zod';

export const isWorkstreamLead = createWorkstreamPermissionRule({
  name: 'IS_WORKSTREAM_LEAD',
  description: 'Allow entities lead by a specified claim',
  resourceType: RESOURCE_TYPE_WORKSTREAM_ENTITY,
  paramsSchema: z.object({
    claim: z.string(),
  }),
  apply: (resource, { claim }) => {
    return resource.spec.lead === claim;
  },
  toQuery: ({ claim }) => {
    return { key: 'spec.lead', value: claim };
  },
});
