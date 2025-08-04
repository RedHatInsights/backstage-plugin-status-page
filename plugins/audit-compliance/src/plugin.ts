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

export const complianceManagerRouteRef = createRouteRef({
  id: 'compliance-manager',
});

export const auditCompliancePlugin = createPlugin({
  id: 'audit-compliance',
  routes: {
    root: rootRouteRef,
    details: detailsRouteRef,
    configurations: configRouteRef,
    complianceManager: complianceManagerRouteRef,
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

// Compliance Manager page
export const ComplianceManagerPage = auditCompliancePlugin.provide(
  createRoutableExtension({
    name: 'ComplianceManagerPage',
    component: () =>
      import('./ComplianceManagerPage').then(m => m.ComplianceManagerPage),
    mountPoint: complianceManagerRouteRef,
  }),
);
