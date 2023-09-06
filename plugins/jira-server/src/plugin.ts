import {
  configApiRef,
  createPlugin,
  createApiFactory,
  discoveryApiRef,
  createComponentExtension,
  identityApiRef,
} from '@backstage/core-plugin-api';

import { jiraApiRef, JiraAPI } from './api';

export const jiraPlugin = createPlugin({
  id: 'plugins.appdev.jira',
  apis: [
    createApiFactory({
      api: jiraApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        configApi: configApiRef,
        identityApi: identityApiRef,
      },
      factory: ({ discoveryApi, configApi, identityApi }) => {
        return new JiraAPI({
          discoveryApi,
          configApi,
          identityApi,
        });
      },
    }),
  ],
});

export const EntityJiraOverviewCard = jiraPlugin.provide(
  createComponentExtension({
    name: 'EntityJiraOverviewCard',
    component: {
      lazy: () => import('./components/JiraCard').then(m => m.JiraCard),
    },
  }),
);
