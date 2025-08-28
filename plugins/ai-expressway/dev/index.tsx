import { createDevApp } from '@backstage/dev-utils';
import { aiExpresswayPlugin, AIExpresswayCard } from '../src/plugin';

createDevApp()
  .registerPlugin(aiExpresswayPlugin)
  .addPage({
    element: <AIExpresswayCard />,
    title: 'AI Expressway',
    path: '/ai-expressway',
  })
  .render();
