import express from 'express';
import { LoggerService } from '@backstage/backend-plugin-api';

/**
 * Creates a simple health check route for the access request plugin.
 *
 * @param logger - Logger service instance for logging health pings
 * @returns {express.Router} Express router with a /health endpoint
 *
 * @route GET /health
 * @returns {Object} 200 - Service is healthy `{ status: "ok" }`
 */
export function createHealthRoute(logger: LoggerService): express.Router {
  const router = express.Router();

  router.get('/', async (_req, res) => {
    logger.info('AccessRequest router health pinged');
    res.json({ status: 'ok' });
  });

  return router;
}
