import { aiExpresswayPlugin, AIExpresswayCard } from './plugin';

describe('aiExpresswayPlugin', () => {
  it('should export the plugin instance', () => {
    expect(aiExpresswayPlugin).toBeDefined();
    expect(aiExpresswayPlugin.getId()).toBe('ai-expressway');
  });

  it('should have the correct route configuration', () => {
    const routes = aiExpresswayPlugin.routes;
    expect(routes.root).toBeDefined();
  });
});

describe('AIExpresswayCard', () => {
  it('should export the AIExpresswayCard component', () => {
    expect(AIExpresswayCard).toBeDefined();
  });

  it('should be a routable extension', () => {
    expect(typeof AIExpresswayCard).toBe('function');
  });
});
