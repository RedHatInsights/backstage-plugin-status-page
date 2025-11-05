import { createDevApp } from '@backstage/dev-utils';
import { systemAuditPlugin, EntitySystemAuditCard } from '../src/plugin';

createDevApp()
  .registerPlugin(systemAuditPlugin)
  .addPage({
    element: (
      <div style={{ padding: '24px' }}>
        <EntitySystemAuditCard />
      </div>
    ),
    title: 'System Audit Card',
    path: '/system-audit',
  })
  .render();
