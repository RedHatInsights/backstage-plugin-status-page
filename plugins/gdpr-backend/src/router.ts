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
   * GET /drupal/:id - Fetch user data by ID with email fallback (Legacy endpoint)
   * Query parameter: ?email=user@example.com (required)
   */
  router.get('/drupal/:id', async (req, res) => {
    const { id } = req.params;
    const { email } = req.query;
    
    // Validate required email parameter
    if (!email || typeof email !== 'string') {
      logger.warn('Missing or invalid email parameter', { userId: id, email });
      res.status(400).json({
        error: {
          message: 'Email query parameter is required and must be a string',
        }
      });
      return;
    }
    
    try {
      logger.info('Fetching user data with email fallback (Legacy)', { userId: id, email });
      const userData = await drupalService.fetchUserData({ id, email });
      
      logger.info('Successfully fetched user data', { 
        userId: id, 
        email,
        platformCount: userData.length 
      });
      
      res.json(userData);
    } catch (error) {
      logger.error('Failed to fetch user data', { 
        userId: id, 
        email,
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
   * GET /drupal/username/:username - Fetch user data by Drupal username only
   * Query parameter: ?serviceNowTicket=TICKET123 (required)
   */
  router.get('/drupal/username/:username', async (req, res) => {
    const { username } = req.params;
    const { serviceNowTicket } = req.query;
    
    // Validate required parameters
    if (!serviceNowTicket || typeof serviceNowTicket !== 'string') {
      logger.warn('Missing or invalid ServiceNow ticket parameter', { username, serviceNowTicket });
      res.status(400).json({
        error: {
          message: 'ServiceNow ticket parameter is required',
        }
      });
      return;
    }
    
    try {
      logger.info('Fetching user data by username only', { username, serviceNowTicket });
      const userData = await drupalService.fetchUserDataByUsername({ username, serviceNowTicket });
      
      logger.info('Successfully fetched user data by username', { 
        username, 
        serviceNowTicket,
        platformCount: userData.length 
      });
      
      res.json(userData);
    } catch (error) {
      logger.error('Failed to fetch user data by username', { 
        username, 
        serviceNowTicket,
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
            message: 'Internal server error while fetching user data by username',
          }
        });
      }
    }
  });

  /**
   * GET /drupal/email/:email - Fetch user data by email only
   * Query parameter: ?serviceNowTicket=TICKET123 (required)
   */
  router.get('/drupal/email/:email', async (req, res) => {
    const { email } = req.params;
    const { serviceNowTicket } = req.query;
    
    // Validate required parameters
    if (!serviceNowTicket || typeof serviceNowTicket !== 'string') {
      logger.warn('Missing or invalid ServiceNow ticket parameter', { email, serviceNowTicket });
      res.status(400).json({
        error: {
          message: 'ServiceNow ticket parameter is required',
        }
      });
      return;
    }
    
    try {
      logger.info('Fetching user data by email only', { email, serviceNowTicket });
      const userData = await drupalService.fetchUserDataByEmail({ email, serviceNowTicket });
      
      logger.info('Successfully fetched user data by email', { 
        email, 
        serviceNowTicket,
        platformCount: userData.length 
      });
      
      res.json(userData);
    } catch (error) {
      logger.error('Failed to fetch user data by email', { 
        email, 
        serviceNowTicket,
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
            message: 'Internal server error while fetching user data by email',
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
