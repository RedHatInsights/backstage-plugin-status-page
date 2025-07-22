import express from 'express';
import { LoggerService } from '@backstage/backend-plugin-api';

interface RouterOptions {
  logger: LoggerService;
}

export async function createRouter({
  logger,
}: RouterOptions): Promise<express.Router> {
  const router = express.Router();
  router.use(express.json());

  // Health check endpoint for the MCP actions example plugin
  router.get('/health', (_, res) => {
    logger.info('MCP actions example plugin health check');
    res.json({ status: 'ok' });
  });

  return router;
}
