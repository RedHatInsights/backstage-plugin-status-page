import {
  createExternalRouteRef,
  createRouteRef,
} from '@backstage/core-plugin-api';

export const rootRouteRef = createRouteRef({
  id: 'redirects',
});

export const catalogRouteRef = createExternalRouteRef({
  id: 'redirect:catalog-details',
  params: ['kind', 'namespace', 'name'],
  defaultTarget: 'catalog',
});

export const techDocsRouteRef = createExternalRouteRef({
  id: 'redirect:techdocs-details',
  params: ['kind', 'namespace', 'name'],
  defaultTarget: 'techdocs.details',
});
