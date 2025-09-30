import { createDevApp } from '@backstage/dev-utils';
import { assistantPlugin, AssistantPanel } from '../src/plugin';

createDevApp()
  .registerPlugin(assistantPlugin)
  .addPage({
    element: <AssistantPanel />,
    title: 'Root Page',
    path: '/assistant',
  })
  .render();
