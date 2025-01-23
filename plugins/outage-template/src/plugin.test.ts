import { outageTemplatePlugin } from './plugin';

describe('outages', () => {
  it('should export plugin', () => {
    expect(outageTemplatePlugin).toBeDefined();
  });
});
