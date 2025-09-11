import { Knex } from 'knex';
import express from 'express';
import Router from 'express-promise-router';
import { AuditComplianceDatabase } from '../database/AuditComplianceDatabase';

/**
 * Creates the activity stream router with all endpoint definitions.
 * @param knex - The Knex client
 * @param logger - The logger service
 * @param config - The root config service
 * @returns An Express router instance with all activity stream routes
 */
export async function createActivityStreamRouter(
  knex: Knex,
  logger: any,
  config: any,
): Promise<express.Router> {
  const database = await AuditComplianceDatabase.create({
    knex,
    skipMigrations: true,
    logger,
    config,
  });

  const router = Router();

  // GET /activity-stream
  router.get('/activity-stream', async (req, res) => {
    try {
      const { app_name, frequency, period, limit, offset, all } = req.query;

      // If 'all' parameter is true, fetch activities from all applications
      if (all === 'true') {
        const events = await database.getActivityStreamEvents({
          app_name: '%', // Wildcard to match all app names
          frequency: frequency as string | undefined,
          period: period as string | undefined,
          limit: limit ? parseInt(limit as string, 10) : 20,
          offset: offset ? parseInt(offset as string, 10) : 0,
        });
        res.json(events);
        return;
      }

      // Original behavior - require app_name when 'all' is not specified
      if (!app_name) {
        res.status(400).json({ error: 'app_name is required' });
        return;
      }

      const events = await database.getActivityStreamEvents({
        app_name: app_name as string,
        frequency: frequency as string | undefined,
        period: period as string | undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });

      res.json(events);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to fetch activity stream';
      logger.error('Error fetching activity stream:', { error: errorMessage });
      res.status(500).json({ error: errorMessage });
    }
  });

  // POST /activity-stream
  router.post('/activity-stream', async (req, res) => {
    try {
      const {
        event_type,
        app_name,
        frequency,
        period,
        user_id,
        performed_by,
        metadata,
      } = req.body;

      if (!event_type || !app_name || !performed_by) {
        res.status(400).json({
          error: 'event_type, app_name, and performed_by are required',
        });
        return;
      }

      const event = await database.createActivityEvent({
        event_type,
        app_name,
        frequency,
        period,
        user_id,
        performed_by,
        metadata,
      });

      res.status(201).json(event);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to create activity event';
      logger.error('Error creating activity event:', { error: errorMessage });
      res.status(500).json({ error: errorMessage });
    }
  });

  return router;
}
