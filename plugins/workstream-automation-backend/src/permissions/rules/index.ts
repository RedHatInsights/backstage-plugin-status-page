import { createPermissionRule } from '@backstage/plugin-permission-node';
import { z } from 'zod';
import {
  artPermissionResourceRef,
  userNotePermissionResourceRef,
  workstreamPermissionResourceRef,
} from '../resources';

export const isWorkstreamLead = createPermissionRule({
  name: 'IS_WORKSTREAM_LEAD',
  description: 'Allow workstream lead',
  resourceRef: workstreamPermissionResourceRef,
  paramsSchema: z.object({
    claim: z.string(),
  }),
  apply(resource, { claim }) {
    return resource.spec.lead === claim;
  },
  toQuery({ claim }) {
    return { key: 'spec.lead', value: claim };
  },
});

export const isArtOwner = createPermissionRule({
  name: 'IS_ART_OWNER',
  resourceRef: artPermissionResourceRef,
  description: 'Allow ART RTE to edit ARTs',
  paramsSchema: z.object({
    claim: z.string(),
  }),
  apply: (resource, { claim }) => resource.spec.rte === claim,
  toQuery: ({ claim }) => ({ key: 'spec.rte', value: claim }),
});

export const workstreamPermissionRules = {
  isWorkstreamLead,
};

export const artPermissionRules = {
  isArtOwner,
};

export const isValidUser = createPermissionRule({
  name: 'IS_VALID_USER',
  description: 'Allow valid user to view user notes',
  resourceRef: userNotePermissionResourceRef,
  paramsSchema: z.object({
    claim: z.string(),
  }),
  apply: (resource, { claim }) => resource === claim,
  toQuery: ({ claim }) => claim,
});

export const userNotePermissionRules = {
  isValidUser,
};
