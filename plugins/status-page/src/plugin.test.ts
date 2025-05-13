import { statusPagePlugin } from './plugin';

describe('status', () => {
  it('should export plugin', () => {
    expect(statusPagePlugin).toBeDefined();
  });
});
