import { LoggerService } from '@backstage/backend-plugin-api';
import { Config } from '@backstage/config';
import { drupalService } from './drupalService';
import { GdprConfig, Platform, DeleteUserDataRequest, UserData } from '../../lib/types';
import * as client from '../../lib/client';
import * as config from '../../lib/config';

// Mock the dependencies
jest.mock('../../lib/client');
jest.mock('../../lib/config');

const mockedClient = client as jest.Mocked<typeof client>;
const mockedConfig = config as jest.Mocked<typeof config>;

describe('drupalService', () => {
  const mockLogger: jest.Mocked<LoggerService> = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    child: jest.fn().mockReturnThis(),
  };

  const mockConfigInstance: jest.Mocked<Config> = {
    getString: jest.fn(),
    getConfig: jest.fn(),
    getOptionalString: jest.fn(),
    has: jest.fn(),
    keys: jest.fn(),
    get: jest.fn(),
    getOptional: jest.fn(),
    getOptionalConfig: jest.fn(),
    getConfigArray: jest.fn(),
    getOptionalConfigArray: jest.fn(),
    getNumber: jest.fn(),
    getOptionalNumber: jest.fn(),
    getBoolean: jest.fn(),
    getOptionalBoolean: jest.fn(),
    getStringArray: jest.fn(),
    getOptionalStringArray: jest.fn(),
  };

  const mockGdprConfig: GdprConfig = {
    dcp: {
      serviceAccount: 'dcp-service',
      token: 'dcp-token',
      apiBaseUrl: 'https://dcp.example.com/api',
    },
    dxsp: {
      serviceAccount: 'dxsp-service',
      token: 'dxsp-token',
      apiBaseUrl: 'https://dxsp.example.com/api',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedConfig.readDrupalConfig.mockReturnValue(mockGdprConfig);
  });

  describe('drupalService factory', () => {
    it('should create service instance successfully', async () => {
      const service = await drupalService({
        logger: mockLogger,
        config: mockConfigInstance,
      } as any);

      expect(service).toBeDefined();
      expect(service.fetchUserData).toBeDefined();
      expect(service.deleteUserData).toBeDefined();
      expect(typeof service.fetchUserData).toBe('function');
      expect(typeof service.deleteUserData).toBe('function');

      expect(mockLogger.info).toHaveBeenCalledWith('Initializing DrupalService');
      expect(mockedConfig.readDrupalConfig).toHaveBeenCalledWith(mockConfigInstance);
    });

    it('should handle config reading errors', async () => {
      const configError = new Error('Configuration not found');
      mockedConfig.readDrupalConfig.mockImplementation(() => {
        throw configError;
      });

      await expect(
        drupalService({
          logger: mockLogger,
          config: mockConfigInstance,
        } as any),
      ).rejects.toThrow('Configuration not found');
    });
  });

  describe('fetchUserData', () => {
    it('should fetch user data successfully', async () => {
      const mockUserData: UserData[] = [
        {
          platform: Platform.DCP,
          user: { uid: '123', name: 'testuser' },
          content: [],
          code: 200,
          status: 'success',
        },
        {
          platform: Platform.DXSP,
          user: { uid: '456', name: 'testuser' },
          content: [],
          code: 200,
          status: 'success',
        },
      ];

      mockedClient.fetchGDPRData.mockResolvedValue(mockUserData);

      const service = await drupalService({
        logger: mockLogger,
        config: mockConfigInstance,
      } as any);

      const result = await service.fetchUserData({ id: 'testuser' });

      expect(result).toBe(mockUserData);
      expect(mockedClient.fetchGDPRData).toHaveBeenCalledWith(
        mockGdprConfig,
        'testuser',
        mockLogger,
      );
    });

    it('should handle fetch errors', async () => {
      const fetchError = new Error('Fetch failed');
      mockedClient.fetchGDPRData.mockRejectedValue(fetchError);

      const service = await drupalService({
        logger: mockLogger,
        config: mockConfigInstance,
      } as any);

      await expect(service.fetchUserData({ id: 'testuser' })).rejects.toThrow('Fetch failed');
    });

    it('should pass empty result when no data found', async () => {
      mockedClient.fetchGDPRData.mockResolvedValue([]);

      const service = await drupalService({
        logger: mockLogger,
        config: mockConfigInstance,
      } as any);

      const result = await service.fetchUserData({ id: 'nonexistent' });

      expect(result).toEqual([]);
    });
  });

  describe('deleteUserData', () => {
    it('should delete user data from multiple platforms successfully', async () => {
      const deleteRequests: DeleteUserDataRequest[] = [
        { uid: 'user123', platform: Platform.DCP },
        { uid: 'user456', platform: Platform.DXSP },
      ];

      mockedClient.deleteUserDataByPlatform
        .mockResolvedValueOnce({ deleted: true, dcp: 'success' })
        .mockResolvedValueOnce({ deleted: true, dxsp: 'success' });

      const service = await drupalService({
        logger: mockLogger,
        config: mockConfigInstance,
      } as any);

      const result = await service.deleteUserData(deleteRequests);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        uid: 'user123',
        platform: Platform.DCP,
        success: true,
        data: { deleted: true, dcp: 'success' },
      });
      expect(result[1]).toEqual({
        uid: 'user456',
        platform: Platform.DXSP,
        success: true,
        data: { deleted: true, dxsp: 'success' },
      });

      expect(mockedClient.deleteUserDataByPlatform).toHaveBeenCalledWith(
        mockGdprConfig,
        'user123',
        Platform.DCP,
        mockLogger,
      );
      expect(mockedClient.deleteUserDataByPlatform).toHaveBeenCalledWith(
        mockGdprConfig,
        'user456',
        Platform.DXSP,
        mockLogger,
      );
    });

    it('should handle partial failures gracefully', async () => {
      const deleteRequests: DeleteUserDataRequest[] = [
        { uid: 'user123', platform: Platform.DCP },
        { uid: 'user456', platform: Platform.DXSP },
      ];

      const deleteError = new Error('Delete failed for DXSP');

      mockedClient.deleteUserDataByPlatform
        .mockResolvedValueOnce({ deleted: true })
        .mockRejectedValueOnce(deleteError);

      const service = await drupalService({
        logger: mockLogger,
        config: mockConfigInstance,
      } as any);

      const result = await service.deleteUserData(deleteRequests);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        uid: 'user123',
        platform: Platform.DCP,
        success: true,
        data: { deleted: true },
      });
      expect(result[1]).toEqual({
        uid: 'user456',
        platform: Platform.DXSP,
        success: false,
        error: 'Delete failed for DXSP',
      });
    });

    it('should handle all failures', async () => {
      const deleteRequests: DeleteUserDataRequest[] = [
        { uid: 'user123', platform: Platform.DCP },
        { uid: 'user456', platform: Platform.DXSP },
      ];

      const dcpError = new Error('DCP delete failed');
      const dxspError = new Error('DXSP delete failed');

      mockedClient.deleteUserDataByPlatform
        .mockRejectedValueOnce(dcpError)
        .mockRejectedValueOnce(dxspError);

      const service = await drupalService({
        logger: mockLogger,
        config: mockConfigInstance,
      } as any);

      const result = await service.deleteUserData(deleteRequests);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        uid: 'user123',
        platform: Platform.DCP,
        success: false,
        error: 'DCP delete failed',
      });
      expect(result[1]).toEqual({
        uid: 'user456',
        platform: Platform.DXSP,
        success: false,
        error: 'DXSP delete failed',
      });
    });

    it('should handle empty delete requests', async () => {
      const service = await drupalService({
        logger: mockLogger,
        config: mockConfigInstance,
      } as any);

      const result = await service.deleteUserData([]);

      expect(result).toEqual([]);
      expect(mockedClient.deleteUserDataByPlatform).not.toHaveBeenCalled();
    });

    it('should handle errors without message property', async () => {
      const deleteRequests: DeleteUserDataRequest[] = [
        { uid: 'user123', platform: Platform.DCP },
      ];

      // Create error without message property
      const errorWithoutMessage = { code: 'NETWORK_ERROR' };

      mockedClient.deleteUserDataByPlatform.mockRejectedValueOnce(errorWithoutMessage);

      const service = await drupalService({
        logger: mockLogger,
        config: mockConfigInstance,
      } as any);

      const result = await service.deleteUserData(deleteRequests);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        uid: 'user123',
        platform: Platform.DCP,
        success: false,
        error: 'Unknown error',
      });
    });

    it('should log incoming requests', async () => {
      const deleteRequests: DeleteUserDataRequest[] = [
        { uid: 'user123', platform: Platform.DCP },
      ];

      mockedClient.deleteUserDataByPlatform.mockResolvedValueOnce({ deleted: true });

      const service = await drupalService({
        logger: mockLogger,
        config: mockConfigInstance,
      } as any);

      await service.deleteUserData(deleteRequests);

      expect(mockLogger.info).toHaveBeenCalledWith(`Incoming requests: ${deleteRequests}`);
    });

    it('should handle concurrent delete operations', async () => {
      const deleteRequests: DeleteUserDataRequest[] = [
        { uid: 'user1', platform: Platform.DCP },
        { uid: 'user2', platform: Platform.DCP },
        { uid: 'user3', platform: Platform.DXSP },
      ];

      // Simulate different response times
      mockedClient.deleteUserDataByPlatform
        .mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ deleted: true }), 10)))
        .mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ deleted: true }), 5)))
        .mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ deleted: true }), 15)));

      const service = await drupalService({
        logger: mockLogger,
        config: mockConfigInstance,
      } as any);

      const result = await service.deleteUserData(deleteRequests);

      expect(result).toHaveLength(3);
      expect(result.every(r => r.success)).toBe(true);
      expect(mockedClient.deleteUserDataByPlatform).toHaveBeenCalledTimes(3);
    });
  });
});
