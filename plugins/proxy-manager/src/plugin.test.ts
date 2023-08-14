import { proxyManagerPlugin } from './plugin';

describe('proxy-manager', () => {
  it('should export plugin', () => {
    expect(proxyManagerPlugin).toBeDefined();
  });
});
