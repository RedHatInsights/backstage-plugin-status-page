import { resolvePackagePath } from '@backstage/backend-plugin-api';
import express from 'express';
import { Knex } from 'knex';
import { AccessRequestBackendDatabase } from '../databse/AccessRequestBackendDatabase';
import { PermissionEmailService } from '../services/email-service/permissionMailerService';
import { RoverClient } from '../services/rover-service/roverService';
import { AccessRequestRouterOptions } from '../services/types';
import { createAccessRequestRoutes } from './accessRequestRoutes';
import { createHealthRoute } from './healthRoutes';
import { createRoverRoutes } from './roverRoutes';

/**
 * Path to the migrations directory for database schema management.
 */
const migrationsDir = resolvePackagePath(
  '@appdev/backstage-plugin-permission-management-backend',
  'migrations',
);

/**
 * Creates or updates the database schema using Knex migrations.
 *
 * @param options - Configuration for schema setup
 * @param options.knex - Knex database client
 * @param options.skipMigrations - Whether to skip migrations
 * @returns {Promise<void>} Resolves once migration is complete or skipped
 */
async function createDatabaseSchema(options: {
  knex: Knex;
  skipMigrations: boolean;
}): Promise<void> {
  if (!options.skipMigrations) {
    await options.knex.migrate.latest({ directory: migrationsDir });
  }
}

/**
 * Initializes and returns the main Express router for the access request plugin.
 *
 * @param options - Router setup options including logger and database services
 * @param options.logger - Logger service instance
 * @param options.database - Database service instance
 * @param options.config - Root configuration service
 * @returns {Promise<express.Router>} Router with mounted routes
 */
export async function createRouter(
  options: AccessRequestRouterOptions,
): Promise<express.Router> {
  const { logger, database, config } = options;

  const router = express.Router();
  router.use(express.json());

  const dbClient = await database.getClient();
  await createDatabaseSchema({ knex: dbClient, skipMigrations: false });

  const accessRequestDb = new AccessRequestBackendDatabase(dbClient);
  const emailService = new PermissionEmailService(config, logger);
  const roverClient = new RoverClient(config, logger);

  // Mount health check route
  router.use('/health', createHealthRoute(logger));

  // Mount core access request routes
  router.use('/access', createAccessRequestRoutes(accessRequestDb, emailService, roverClient, config));

  // Mount Rover API integration routes
  router.use('/rover', createRoverRoutes(roverClient));

  return router;
}
