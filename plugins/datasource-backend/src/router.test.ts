import { mockErrorHandler } from '@backstage/backend-test-utils';
import express from 'express';
import { createHealthRouter } from './services/healthRouter';

// TEMPLATE NOTE:
// Testing the router directly allows you to write a unit test that mocks the provided options.
describe('createRouter', () => {
  let app: express.Express;

  beforeEach(async () => {
    const router = await createHealthRouter();
    app = express();
    app.use(router);
    app.use(mockErrorHandler());
  });
});
