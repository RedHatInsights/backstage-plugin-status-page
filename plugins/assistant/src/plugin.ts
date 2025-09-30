import {
  createComponentExtension,
  createPlugin,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const assistantPlugin = createPlugin({
  id: 'assistant',
  routes: {
    root: rootRouteRef,
  },
});

export const AssistantProvider = assistantPlugin.provide(
  createComponentExtension({
    name: 'AssistantProvider',
    component: {
      lazy: () => import('./contexts/AgentProvider').then(m => m.AgentProvider),
    },
  }),
);

export const AssistantPanel = assistantPlugin.provide(
  createComponentExtension({
    name: 'AssistantPanel',
    component: {
      lazy: () => import('./components/ChatPanel').then(m => m.ChatPanel),
    },
  }),
);
