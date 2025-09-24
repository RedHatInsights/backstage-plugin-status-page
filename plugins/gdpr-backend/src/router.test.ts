import express from 'express';
import request from 'supertest';
import { LoggerService } from '@backstage/backend-plugin-api';
import { createRouter } from './router';
import { DrupalService } from './services/drupal/types';
import { Platform, GdprError, UserData, DeleteResult } from './lib/types';

describe('createRouter', () => {
  let app: express.Express;
  let mockLogger: jest.Mocked<LoggerService>;
  let mockDrupalService: jest.Mocked<DrupalService>;

  const mockUserData: UserData[] = [
    {
      platform: Platform.DCP,
      user: { uid: '123', name: 'testuser' },
      content: {},
      code: 200,
      status: 'success',
    },
    {
      platform: Platform.DXSP,
      user: { uid: '456', name: 'testuser' },
      content: {},
      code: 200,
      status: 'success',
    },
  ];

  beforeEach(async () => {
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      child: jest.fn().mockReturnThis(),
    };

    mockDrupalService = {
      fetchUserData: jest.fn(),
      deleteUserData: jest.fn(),
    };

    const router = await createRouter({
      logger: mockLogger,
      drupalService: mockDrupalService,
    } as any);

    app = express().use(router);
  });

  describe('GET /drupal/:id', () => {
    it('should fetch user data successfully', async () => {
      mockDrupalService.fetchUserData.mockResolvedValue(mockUserData);

      const response = await request(app)
        .get('/drupal/testuser')
        .expect(200);

      expect(response.body).toEqual(mockUserData);
      expect(mockDrupalService.fetchUserData).toHaveBeenCalledWith({ id: 'testuser' });
      expect(mockLogger.info).toHaveBeenCalledWith('Fetching user data', { userId: 'testuser' });
      expect(mockLogger.info).toHaveBeenCalledWith('Successfully fetched user data', {
        userId: 'testuser',
        platformCount: 2,
      });
    });

    it('should handle GdprError with status code', async () => {
      const gdprError = new GdprError('User not found', Platform.DCP, 404);
      mockDrupalService.fetchUserData.mockRejectedValue(gdprError);

      const response = await request(app)
        .get('/drupal/nonexistent')
        .expect(404);

      expect(response.body).toEqual({
        error: {
          message: 'User not found',
          platform: Platform.DCP,
          statusCode: 404,
        },
      });

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to fetch user data', {
        userId: 'nonexistent',
        error: 'User not found',
      });
    });

    it('should handle GdprError without status code', async () => {
      const gdprError = new GdprError('Network error', Platform.DXSP);
      mockDrupalService.fetchUserData.mockRejectedValue(gdprError);

      const response = await request(app)
        .get('/drupal/testuser')
        .expect(500);

      expect(response.body).toEqual({
        error: {
          message: 'Network error',
          platform: Platform.DXSP,
          statusCode: undefined,
        },
      });
    });

    it('should handle generic errors', async () => {
      const genericError = new Error('Database connection failed');
      mockDrupalService.fetchUserData.mockRejectedValue(genericError);

      const response = await request(app)
        .get('/drupal/testuser')
        .expect(500);

      expect(response.body).toEqual({
        error: {
          message: 'Internal server error while fetching user data',
        },
      });

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to fetch user data', {
        userId: 'testuser',
        error: 'Database connection failed',
      });
    });

    it('should handle non-Error objects', async () => {
      mockDrupalService.fetchUserData.mockRejectedValue('String error');

      const response = await request(app)
        .get('/drupal/testuser')
        .expect(500);

      expect(response.body).toEqual({
        error: {
          message: 'Internal server error while fetching user data',
        },
      });

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to fetch user data', {
        userId: 'testuser',
        error: 'String error',
      });
    });

    it('should handle special characters in user ID', async () => {
      mockDrupalService.fetchUserData.mockResolvedValue(mockUserData);

      await request(app)
        .get('/drupal/user@example.com')
        .expect(200);

      expect(mockDrupalService.fetchUserData).toHaveBeenCalledWith({ id: 'user@example.com' });
    });

    it('should handle empty user data response', async () => {
      mockDrupalService.fetchUserData.mockResolvedValue([]);

      const response = await request(app)
        .get('/drupal/testuser')
        .expect(200);

      expect(response.body).toEqual([]);
      expect(mockLogger.info).toHaveBeenCalledWith('Successfully fetched user data', {
        userId: 'testuser',
        platformCount: 0,
      });
    });
  });

  describe('DELETE /drupal', () => {
    const validDeleteRequest = [
      { uid: 'user123', platform: Platform.DCP },
      { uid: 'user456', platform: Platform.DXSP },
    ];

    const mockDeleteResults: DeleteResult[] = [
      {
        uid: 'user123',
        platform: Platform.DCP,
        success: true,
        data: { deleted: true },
      },
      {
        uid: 'user456',
        platform: Platform.DXSP,
        success: true,
        data: { deleted: true },
      },
    ];

    it('should delete user data successfully', async () => {
      mockDrupalService.deleteUserData.mockResolvedValue(mockDeleteResults);

      const response = await request(app)
        .delete('/drupal')
        .send(validDeleteRequest)
        .expect(200);

      expect(response.body).toEqual(mockDeleteResults);
      expect(mockDrupalService.deleteUserData).toHaveBeenCalledWith(validDeleteRequest);
      expect(mockLogger.info).toHaveBeenCalledWith('Processing delete requests', {
        requestCount: 2,
        platforms: [Platform.DCP, Platform.DXSP],
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Delete requests completed', {
        total: 2,
        successful: 2,
        failed: 0,
      });
    });

    it('should handle partial success', async () => {
      const mixedResults: DeleteResult[] = [
        {
          uid: 'user123',
          platform: Platform.DCP,
          success: true,
          data: { deleted: true },
        },
        {
          uid: 'user456',
          platform: Platform.DXSP,
          success: false,
          error: 'User not found',
        },
      ];

      mockDrupalService.deleteUserData.mockResolvedValue(mixedResults);

      const response = await request(app)
        .delete('/drupal')
        .send(validDeleteRequest)
        .expect(200);

      expect(response.body).toEqual(mixedResults);
      expect(mockLogger.info).toHaveBeenCalledWith('Delete requests completed', {
        total: 2,
        successful: 1,
        failed: 1,
      });
    });

    it('should validate request body is array', async () => {
      const response = await request(app)
        .delete('/drupal')
        .send({ uid: 'user123', platform: Platform.DCP })
        .expect(400);

      expect(response.body).toEqual({
        error: {
          message: 'Request body must be an array of delete requests',
        },
      });

      expect(mockLogger.warn).toHaveBeenCalledWith('Invalid delete request format', {
        body: { uid: 'user123', platform: Platform.DCP },
      });
    });

    it('should validate platform values', async () => {
      const invalidRequest = [
        { uid: 'user123', platform: 'invalid_platform' },
        { uid: 'user456', platform: Platform.DCP },
      ];

      const response = await request(app)
        .delete('/drupal')
        .send(invalidRequest)
        .expect(400);

      expect(response.body).toEqual({
        error: {
          message: 'Invalid platform values. Valid platforms are: dcp, dxsp',
          invalidRequests: [{ uid: 'user123', platform: 'invalid_platform' }],
        },
      });

      expect(mockLogger.warn).toHaveBeenCalledWith('Invalid platform values in delete request', {
        invalidRequests: [{ uid: 'user123', platform: 'invalid_platform' }],
        validPlatforms: ['dcp', 'dxsp'],
      });
    });

    it('should handle missing platform in request', async () => {
      const invalidRequest = [
        { uid: 'user123' }, // Missing platform
        { uid: 'user456', platform: Platform.DCP },
      ];

      const response = await request(app)
        .delete('/drupal')
        .send(invalidRequest)
        .expect(400);

      expect(response.body.error.message).toContain('Invalid platform values');
      expect(response.body.error.invalidRequests).toHaveLength(1);
    });

    it('should handle empty request array', async () => {
      mockDrupalService.deleteUserData.mockResolvedValue([]);

      const response = await request(app)
        .delete('/drupal')
        .send([])
        .expect(200);

      expect(response.body).toEqual([]);
      expect(mockLogger.info).toHaveBeenCalledWith('Processing delete requests', {
        requestCount: 0,
        platforms: [],
      });
    });

    it('should handle service errors', async () => {
      const serviceError = new Error('Database connection failed');
      mockDrupalService.deleteUserData.mockRejectedValue(serviceError);

      const response = await request(app)
        .delete('/drupal')
        .send(validDeleteRequest)
        .expect(500);

      expect(response.body).toEqual({
        error: {
          message: 'Internal server error while deleting user data',
        },
      });

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to process delete requests', {
        error: 'Database connection failed',
      });
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .delete('/drupal')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      // Express handles malformed JSON automatically
      expect(response.status).toBe(400);
    });

    it('should handle requests with null platform', async () => {
      const invalidRequest = [
        { uid: 'user123', platform: null },
      ];

      const response = await request(app)
        .delete('/drupal')
        .send(invalidRequest)
        .expect(400);

      expect(response.body.error.message).toContain('Invalid platform values');
    });

    it('should handle large request arrays', async () => {
      const largeRequest = Array.from({ length: 100 }, (_, i) => ({
        uid: `user${i}`,
        platform: i % 2 === 0 ? Platform.DCP : Platform.DXSP,
      }));

      const largeResults = largeRequest.map(req => ({
        uid: req.uid,
        platform: req.platform,
        success: true,
        data: { deleted: true },
      }));

      mockDrupalService.deleteUserData.mockResolvedValue(largeResults);

      const response = await request(app)
        .delete('/drupal')
        .send(largeRequest)
        .expect(200);

      expect(response.body).toHaveLength(100);
      expect(mockLogger.info).toHaveBeenCalledWith('Processing delete requests', {
        requestCount: 100,
        platforms: expect.any(Array),
      });
    });
  });

  describe('middleware and error handling', () => {
    it('should parse JSON bodies correctly', async () => {
      mockDrupalService.fetchUserData.mockResolvedValue(mockUserData);

      await request(app)
        .get('/drupal/testuser')
        .set('Content-Type', 'application/json')
        .expect(200);

      expect(mockDrupalService.fetchUserData).toHaveBeenCalled();
    });

    it('should handle unsupported routes', async () => {
      const response = await request(app)
        .post('/drupal/unsupported')
        .expect(404);
      
      expect(response.status).toBe(404);
    });

    it('should handle invalid HTTP methods', async () => {
      const response = await request(app)
        .patch('/drupal/testuser')
        .expect(404);
      
      expect(response.status).toBe(404);
    });
  });
});
