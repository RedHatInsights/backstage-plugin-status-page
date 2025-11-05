import {
  DatabaseService,
  LoggerService,
  RootConfigService,
  resolvePackagePath,
} from '@backstage/backend-plugin-api';
import express from 'express';
import Router from 'express-promise-router';
import { Knex } from 'knex';
import { SystemAuditOperations } from './database/SystemAuditOperations';

const migrationsDir = resolvePackagePath(
  '@appdev/backstage-plugin-system-audit-backend',
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
  _config: RootConfigService,
  logger: LoggerService,
): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  const knex = await databaseServer.getClient();
  await createDatabaseSchema(knex, false);

  const operations = new SystemAuditOperations(knex, logger);

  // Health check endpoint (must be before /:id route)
  router.get('/health', (_, res) => res.json({ status: 'ok' }));

  // POST create a new system audit entry
  router.post('/create-entry', async (req, res) => {
    try {
      const entryData = req.body;
      logger.info('Creating entry with data:', { data: entryData });
      const newEntry = await operations.createEntry(entryData);
      res.status(201).json({ entry: newEntry });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(
        'Error creating system audit entry:',
        error instanceof Error ? error : new Error(errorMessage),
      );
      res.status(500).json({
        error: 'Failed to create system audit entry',
        details: errorMessage,
      });
    }
  });

  // GET all system audit entries
  router.get('/', async (_req, res) => {
    try {
      const entries = await operations.getAllEntries();
      res.json({ entries });
    } catch (error) {
      logger.error(
        'Error fetching system audit entries:',
        error instanceof Error ? error : new Error(String(error)),
      );
      res.status(500).json({ error: 'Failed to fetch system audit entries' });
    }
  });

  // GET a specific system audit entry by ID (must be after /health and / routes)
  router.get('/:id', async (req, res) => {
    try {
      // Skip if this is 'health' route
      if (req.params.id === 'health') {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid ID format' });
        return;
      }
      const entry = await operations.getEntryById(id);
      if (!entry) {
        res.status(404).json({ error: 'Entry not found' });
        return;
      }
      res.json({ entry });
    } catch (error) {
      logger.error(
        'Error fetching system audit entry:',
        error instanceof Error ? error : new Error(String(error)),
      );
      res.status(500).json({ error: 'Failed to fetch system audit entry' });
    }
  });

  // PUT update a system audit entry
  router.put('/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid ID format' });
        return;
      }
      const updateData = req.body;
      const updatedEntry = await operations.updateEntry(id, updateData);
      if (!updatedEntry) {
        res.status(404).json({ error: 'Entry not found' });
        return;
      }
      res.json({ entry: updatedEntry });
    } catch (error) {
      logger.error(
        'Error updating system audit entry:',
        error instanceof Error ? error : new Error(String(error)),
      );
      res.status(500).json({ error: 'Failed to update system audit entry' });
    }
  });

  // DELETE a system audit entry
  router.delete('/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid ID format' });
        return;
      }
      const deleted = await operations.deleteEntry(id);
      if (!deleted) {
        res.status(404).json({ error: 'Entry not found' });
        return;
      }
      res.json({ message: 'Entry deleted successfully' });
    } catch (error) {
      logger.error(
        'Error deleting system audit entry:',
        error instanceof Error ? error : new Error(String(error)),
      );
      res.status(500).json({ error: 'Failed to delete system audit entry' });
    }
  });

  return router;
}
