import { datasourcePlugin } from './plugin';

describe('datasource', () => {
  it('should export plugin', () => {
    expect(datasourcePlugin).toBeDefined();
  });
});
