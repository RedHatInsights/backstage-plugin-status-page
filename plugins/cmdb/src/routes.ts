import { createRouteRef } from '@backstage/core-plugin-api';

export const rootRouteRef = createRouteRef({
  id: 'cmdb',
});

export const infraDetailsRouteRef = createRouteRef({
  id: 'cmdb:infra-details',
  params: ['namespace', 'kind', 'name'],
});
