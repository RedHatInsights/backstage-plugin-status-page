import {
  createApiFactory,
  createPlugin,
  createRoutableExtension,
  discoveryApiRef,
  configApiRef,
  identityApiRef,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';
import { FeedbackAPI, feedbackApiRef } from './api';

export const feedbackPlugin = createPlugin({
  id: 'feedback',
  routes: {
    root: rootRouteRef,
  },
  apis: [
    createApiFactory({
      api: feedbackApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        configApi: configApiRef,
        identityApi: identityApiRef,
      },
      factory: ({ discoveryApi, configApi, identityApi }) => {
        return new FeedbackAPI({ discoveryApi, configApi, identityApi });
      },
    }),
  ],
});

export const GlobalFeedbackPage = feedbackPlugin.provide(
  createRoutableExtension({
    name: 'GlobalFeedbackPage',
    component: () =>
      import('./components/GlobalFeedbackPage').then(m => m.GlobalFeedbackPage),
    mountPoint: rootRouteRef,
  }),
);

export const EntityFeedbackPage = feedbackPlugin.provide(
  createRoutableExtension({
    name: 'EntityFeedbackPage',
    component: () =>
      import('./components/EntityFeedbackPage').then(m => m.EntityFeedbackPage),
    mountPoint: rootRouteRef,
  }),
);
