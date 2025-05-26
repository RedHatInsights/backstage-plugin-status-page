import { createRouteRef } from '@backstage/core-plugin-api';

export const rootRouteRef = createRouteRef({
  id: 'outages',
});

export const createIncidentRouteRef = createRouteRef({
  id: 'create-incident',
});
