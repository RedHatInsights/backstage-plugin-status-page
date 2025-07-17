import { mockServices } from '@backstage/backend-test-utils';
import express from 'express';
import request from 'supertest';

import { createRouter } from './router';
import { Workstream } from '../types';
import { DatabaseManager } from '@backstage/backend-defaults/database';
import { ConfigReader } from '@backstage/config';
import { PermissionsRegistryService } from '@backstage/backend-plugin-api';
import { catalogServiceMock } from '@backstage/plugin-catalog-node/testUtils';

jest.mock('../database', () => ({
  WorkstreamBackendDatabase: {
    create: jest.fn().mockImplementation(() => {
      return {
        insertWorkstream: () => Promise<Workstream>,
        getWorkstreamById: () => Promise<Workstream | null>,
        listWorkstreams: () => Promise<Workstream[]>,
        getWorkstreamForMember: () => Promise<Workstream[]>,
        updateWorkstream: () => Promise<Workstream | null>,
        deleteWorkstream: () => Promise<any>,
      };
    }),
  },
}));

describe('createRouter', () => {
  let app: express.Express;

  beforeAll(async () => {
    const mockConfig = new ConfigReader({
      backend: {
        database: {
          client: 'better-sqlite3',
          connection: ':memory:',
        },
      },
    });
    const router = await createRouter({
      logger: mockServices.logger.mock(),
      config: mockServices.rootConfig(),
      auth: mockServices.auth(),
      database: DatabaseManager.fromConfig(mockConfig).forPlugin('workstream', {
        lifecycle: mockServices.lifecycle.mock(),
        logger: mockServices.logger.mock(),
      }),
      discovery: mockServices.discovery(),
      httpAuth: mockServices.httpAuth(),
      permissions: mockServices.permissions(),
      catalog: catalogServiceMock(),
      permissionsRegistry: {} as PermissionsRegistryService,
    });
    app = express().use(router);
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /health', () => {
    it('returns ok', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({ status: 'ok' });
    });
  });
});
