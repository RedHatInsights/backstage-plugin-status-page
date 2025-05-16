import { auditCompliancePlugin } from './plugin';

describe('audit-compliance', () => {
  it('should export plugin', () => {
    expect(auditCompliancePlugin).toBeDefined();
  });
});
