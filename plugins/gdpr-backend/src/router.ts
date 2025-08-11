import {
  HttpAuthService,
  LoggerService,
  RootConfigService
} from '@backstage/backend-plugin-api';
import express from 'express';
import Router from 'express-promise-router';
import { DrupalService } from './services/drupal/types';
import { GdprError, Platform } from './lib/types';

/**
 * Creates the GDPR router with proper error handling and logging
 */
export async function createRouter({
  logger,
  drupalService,
}: {
  logger: LoggerService;
  config: RootConfigService;
  httpAuth: HttpAuthService;
  drupalService: DrupalService;
}): Promise<express.Router> {

  const router = Router();
  router.use(express.json());

  /**
   * GET /drupal/:id - Fetch user data by ID
   */
  router.get('/drupal/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
      logger.info('Fetching user data', { userId: id });
      const userData = await drupalService.fetchUserData({ id });
      
      logger.info('Successfully fetched user data', { 
        userId: id, 
        platformCount: userData.length 
      });
      
      res.json(userData);
    } catch (error) {
      logger.error('Failed to fetch user data', { 
        userId: id, 
        error: error instanceof Error ? error.message : String(error) 
      });

      if (error instanceof GdprError) {
        res.status(error.statusCode || 500).json({
          error: {
            message: error.message,
            platform: error.platform,
            statusCode: error.statusCode,
          }
        });
      } else {
        res.status(500).json({
          error: {
            message: 'Internal server error while fetching user data',
          }
        });
      }
    }
  });

  /**
   * DELETE /drupal - Delete user data from specified platforms
   */
  router.delete('/drupal', async (req, res) => {
    try {
      const requests = req.body;
      
      // Validate request body
      if (!Array.isArray(requests)) {
        logger.warn('Invalid delete request format', { body: req.body });
        res.status(400).json({
          error: {
            message: 'Request body must be an array of delete requests',
          }
        });
        return;
      }

      // Validate platform values
      const validPlatforms = Object.values(Platform);
      const invalidRequests = requests.filter(request => 
        !request.platform || !validPlatforms.includes(request.platform)
      );

      if (invalidRequests.length > 0) {
        logger.warn('Invalid platform values in delete request', { 
          invalidRequests,
          validPlatforms 
        });
        res.status(400).json({
          error: {
            message: `Invalid platform values. Valid platforms are: ${validPlatforms.join(', ')}`,
            invalidRequests,
          }
        });
        return;
      }

      logger.info('Processing delete requests', { 
        requestCount: requests.length,
        platforms: requests.map(request => request.platform)
      });

      const results = await drupalService.deleteUserData(requests);
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      logger.info('Delete requests completed', { 
        total: results.length,
        successful: successCount,
        failed: failureCount
      });

      res.json(results);
    } catch (error) {
      logger.error('Failed to process delete requests', { 
        error: error instanceof Error ? error.message : String(error) 
      });

      res.status(500).json({
        error: {
          message: 'Internal server error while deleting user data',
        }
      });
    }
  });

  /**
   * GET /health - Health check endpoint
   */
  router.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  return router;
}
