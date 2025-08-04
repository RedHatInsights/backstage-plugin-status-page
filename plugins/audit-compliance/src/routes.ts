import { createRouteRef } from '@backstage/core-plugin-api';

export const rootRouteRef = createRouteRef({
  id: 'audit-compliance',
});

export const detailsRouteRef = createRouteRef({
  id: 'audit-compliance-details',
});

export const configRouteRef = createRouteRef({
  id: 'audit-compliance-configuration',
});

export const complianceManagerRouteRef = createRouteRef({
  id: 'compliance-manager',
});
