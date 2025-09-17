import { createDevApp } from '@backstage/dev-utils';
import { compliancePlugin, CompliancePage } from '../src/plugin';

createDevApp()
  .registerPlugin(compliancePlugin)
  .addPage({
    element: <CompliancePage />,
    title: 'Root Page',
    path: '/compliance',
  })
  .render();
