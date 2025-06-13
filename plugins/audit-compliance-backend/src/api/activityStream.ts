import { Router } from 'express';
import { Logger } from 'winston';
import { AuditComplianceDatabase } from '../database/AuditComplianceDatabase';

export interface RouterOptions {
  logger: Logger;
  database: AuditComplianceDatabase;
}

export async function createRouter(options: RouterOptions): Promise<Router> {
  const { logger, database } = options;
  const router = Router();

  // GET /activity-stream
  router.get('/activity-stream', async (req, res) => {
    try {
      const { app_name, frequency, period, limit, offset } = req.query;

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
