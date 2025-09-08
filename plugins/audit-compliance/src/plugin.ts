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

export const complianceManagerNewRouteRef = createRouteRef({
  id: 'compliance-manager-new',
});

export const auditCompliancePlugin = createPlugin({
  id: 'audit-compliance',
  routes: {
    root: rootRouteRef,
    details: detailsRouteRef,
    configurations: configRouteRef,
    complianceManager: complianceManagerRouteRef,
    complianceManagerNew: complianceManagerNewRouteRef,
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

// Compliance Manager New page
export const ComplianceManagerPageNew = auditCompliancePlugin.provide(
  createRoutableExtension({
    name: 'ComplianceManagerPageNew',
    component: () =>
      import('./ComplianceManagerPageNew').then(
        m => m.ComplianceManagerPageNew,
      ),
    mountPoint: complianceManagerNewRouteRef,
  }),
);
