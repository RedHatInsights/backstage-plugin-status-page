import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { auditCompliancePlugin, AuditCompliancePage } from '../src/plugin';

createDevApp()
  .registerPlugin(auditCompliancePlugin)
  .addPage({
    element: <AuditCompliancePage />,
    title: 'Root Page',
    path: '/audit-compliance',
  })
  .render();
