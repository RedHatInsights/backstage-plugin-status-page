import { lighthousePlugin } from './plugin';

describe('lighthouse', () => {
  it('should export plugin', () => {
    expect(lighthousePlugin).toBeDefined();
  });
});
