import { HostDiscovery } from '@backstage/backend-common';
import { DiscoveryService } from '@backstage/backend-plugin-api';
import express from 'express';
import request from 'supertest';

import { createRouter } from './router';
import { Logger, createLogger, transports } from 'winston';
import { Config, ConfigReader } from '@backstage/config';

describe('createRouter', () => {
  const config: Config = new ConfigReader({});
  const discovery: DiscoveryService = HostDiscovery.fromConfig(config);
  const logger: Logger = createLogger({
    transports: [new transports.Console({ silent: true })],
  });
  let app: express.Express;

  beforeAll(async () => {
    const router = await createRouter({
      logger: logger,
      config: config,
      discovery: discovery,
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
