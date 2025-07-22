import { compassAssistantExamplePlugin } from './plugin';

describe('compassAssistantExamplePlugin', () => {
  it('should be defined', () => {
    expect(compassAssistantExamplePlugin).toBeDefined();
    expect(compassAssistantExamplePlugin.$$type).toBe('@backstage/BackendFeature');
  });
});
