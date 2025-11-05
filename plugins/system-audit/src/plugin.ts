import {
  createPlugin,
  createComponentExtension,
} from '@backstage/core-plugin-api';

export const systemAuditPlugin = createPlugin({
  id: 'system-audit',
});

export const EntitySystemAuditCard = systemAuditPlugin.provide(
  createComponentExtension({
    name: 'EntitySystemAuditCard',
    component: {
      lazy: () =>
        import('./components/EntitySystemAuditCard').then(
          m => m.EntitySystemAuditCard,
        ),
    },
  }),
);
