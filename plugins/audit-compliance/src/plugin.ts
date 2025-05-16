import {
  createPlugin,
  createRoutableExtension,
  createRouteRef,
} from '@backstage/core-plugin-api';


export const rootRouteRef = createRouteRef({
  id: 'audit-compliance',
});

export const detailsRouteRef = createRouteRef({
  id: 'audit-compliance-details',
  params: ['id'],
});
export const configRouteRef = createRouteRef({
  id: 'audit-compliance-configuration',
});

export const auditCompliancePlugin = createPlugin({
  id: 'audit-compliance',
  routes: {
    root: rootRouteRef,
    details: detailsRouteRef,
    configurations: configRouteRef, 
  },
});

// Main page
export const AuditCompliancePage = auditCompliancePlugin.provide(
  createRoutableExtension({
    name: 'AuditCompliancePage',
    component: () =>
      import('./AuditCompliancePage').then(m => m.AuditCompliancePage),
    mountPoint: rootRouteRef,
  }),
);


