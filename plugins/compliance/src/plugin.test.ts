import { compliancePlugin } from './plugin';

describe('compliance', () => {
  it('should export plugin', () => {
    expect(compliancePlugin).toBeDefined();
  });
});
