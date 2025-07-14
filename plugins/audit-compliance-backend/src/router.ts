import {
  DatabaseService,
  LoggerService,
  RootConfigService,
  resolvePackagePath,
} from '@backstage/backend-plugin-api';
import express from 'express';
import Router from 'express-promise-router';
import { createCombinedRouter } from './routes';
import { Knex } from 'knex';

const migrationsDir = resolvePackagePath(
  '@appdev/backstage-plugin-audit-compliance-backend',
  'migrations',
);

async function createDatabaseSchema(knex: Knex, skipMigrations: boolean) {
  if (!skipMigrations) {
    await knex.migrate.latest({ directory: migrationsDir });
  }
}

// Create and return the application router
export async function createRouter(
  databaseServer: DatabaseService,
  config: RootConfigService,
  logger: LoggerService,
): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  const knex = await databaseServer.getClient();
  await createDatabaseSchema(knex, false);

  const combinedRouter = await createCombinedRouter(knex, config, logger);
  router.use('/', combinedRouter);
  return router;
}
