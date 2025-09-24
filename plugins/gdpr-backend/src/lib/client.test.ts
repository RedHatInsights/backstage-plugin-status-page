import { LoggerService } from '@backstage/backend-plugin-api';
import { fetchGDPRData, deleteUserDataByPlatform } from './client';
import { Platform, GdprConfig, GdprError } from './types';
import * as httpUtils from './httpUtils';
import * as utils from './utils';

// Mock the dependencies
jest.mock('./httpUtils');
jest.mock('./utils');

const mockedHttpUtils = httpUtils as jest.Mocked<typeof httpUtils>;
const mockedUtils = utils as jest.Mocked<typeof utils>;

describe('client', () => {
  const mockConfig: GdprConfig = {
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
    cppg: {
      serviceAccount: 'cppg-service',
      token: 'cppg-token',
      apiBaseUrl: 'https://cppg.example.com/api',
    },
    cphub: {
      serviceAccount: 'cphub-service',
      token: 'cphub-token',
      apiBaseUrl: 'https://cphub.example.com/api',
    },
  };

  const mockLogger: jest.Mocked<LoggerService> = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    child: jest.fn().mockReturnThis(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchGDPRData', () => {
    const mockUserData = {
      platform: Platform.DCP,
      user: { uid: '123', name: 'testuser' },
      content: {},
      code: 200,
      status: 'success',
    };

    beforeEach(() => {
      mockedUtils.formatUserData.mockReturnValue(mockUserData);
    });

    it('should fetch data from both platforms successfully', async () => {
      const mockDcpResponse = new Response('{"success": true}', { status: 200 });
      const mockDxspResponse = new Response('{"success": true}', { status: 200 });

      mockedHttpUtils.makeAuthenticatedRequest
        .mockResolvedValueOnce(mockDcpResponse)
        .mockResolvedValueOnce(mockDxspResponse);

      mockedHttpUtils.parseJsonResponse
        .mockResolvedValueOnce({ dcp: 'data' })
        .mockResolvedValueOnce({ dxsp: 'data' });

      const result = await fetchGDPRData(mockConfig, 'testuser', 'test@example.com', mockLogger);

      expect(result).toHaveLength(2);
      expect(result[0]).toBe(mockUserData);
      expect(result[1]).toBe(mockUserData);

      expect(mockLogger.info).toHaveBeenCalledWith('Starting GDPR data fetch', {
        name: 'testuser',
        dcpUrl: mockConfig.dcp.apiBaseUrl,
        dxspUrl: mockConfig.dxsp.apiBaseUrl,
      });

      expect(mockLogger.info).toHaveBeenCalledWith('Successfully fetched data from both platforms');
    });

    it('should return only DCP data when DXSP fails', async () => {
      const mockDcpResponse = new Response('{"success": true}', { status: 200 });
      const dxspError = new GdprError('DXSP error', Platform.DXSP, 500);

      mockedHttpUtils.makeAuthenticatedRequest
        .mockResolvedValueOnce(mockDcpResponse)
        .mockRejectedValueOnce(dxspError);

      mockedHttpUtils.parseJsonResponse.mockResolvedValueOnce({ dcp: 'data' });

      const result = await fetchGDPRData(mockConfig, 'testuser', 'test@example.com', mockLogger);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(mockUserData);

      expect(mockLogger.info).toHaveBeenCalledWith('Successfully fetched data from DCP');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Failed to fetch data from DXSP, continuing with DCP data only',
        { error: dxspError },
      );
    });

    it('should fallback to DXSP only when DCP fails', async () => {
      const dcpError = new GdprError('DCP error', Platform.DCP, 403);
      const mockDxspResponse = new Response('{"success": true}', { status: 200 });

      mockedHttpUtils.makeAuthenticatedRequest
        .mockRejectedValueOnce(dcpError)
        .mockResolvedValueOnce(mockDxspResponse);

      mockedHttpUtils.parseJsonResponse.mockResolvedValueOnce({ dxsp: 'data' });

      const result = await fetchGDPRData(mockConfig, 'testuser', 'test@example.com', mockLogger);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(mockUserData);

      expect(mockLogger.warn).toHaveBeenCalledWith('Failed to fetch data from DCP', { error: dcpError });
      expect(mockLogger.info).toHaveBeenCalledWith('Successfully fetched data from DXSP (fallback)');
    });

    it('should throw error when both platforms fail', async () => {
      const dcpError = new GdprError('DCP error', Platform.DCP, 500);
      const dxspError = new GdprError('DXSP error', Platform.DXSP, 500);

      mockedHttpUtils.makeAuthenticatedRequest
        .mockRejectedValueOnce(dcpError)
        .mockRejectedValueOnce(dxspError);

      await expect(fetchGDPRData(mockConfig, 'testuser', 'test@example.com', mockLogger)).rejects.toThrow(GdprError);

      expect(mockLogger.warn).toHaveBeenCalledWith('Failed to fetch data from DCP', { error: dcpError });
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to fetch data from both platforms', {
        dcpError,
        dxspError,
      });
    });

    it('should work without logger', async () => {
      const mockDcpResponse = new Response('{"success": true}', { status: 200 });
      const mockDxspResponse = new Response('{"success": true}', { status: 200 });

      mockedHttpUtils.makeAuthenticatedRequest
        .mockResolvedValueOnce(mockDcpResponse)
        .mockResolvedValueOnce(mockDxspResponse);

      mockedHttpUtils.parseJsonResponse
        .mockResolvedValueOnce({ dcp: 'data' })
        .mockResolvedValueOnce({ dxsp: 'data' });

      const result = await fetchGDPRData(mockConfig, 'testuser', 'test@example.com');

      expect(result).toHaveLength(2);
      expect(result[0]).toBe(mockUserData);
      expect(result[1]).toBe(mockUserData);
    });

    it('should make correct API calls', async () => {
      const mockDcpResponse = new Response('{"success": true}', { status: 200 });
      
      mockedHttpUtils.makeAuthenticatedRequest.mockResolvedValueOnce(mockDcpResponse);
      mockedHttpUtils.parseJsonResponse.mockResolvedValueOnce({ dcp: 'data' });

      await fetchGDPRData(mockConfig, 'testuser', 'test@example.com', mockLogger);

      expect(mockedHttpUtils.makeAuthenticatedRequest).toHaveBeenCalledWith(
        mockConfig.dcp.apiBaseUrl,
        mockConfig.dcp,
        Platform.DCP,
        {
          method: 'POST',
          body: JSON.stringify({ summarize: true, name: 'testuser' }),
        },
        mockLogger,
      );

      expect(mockedUtils.formatUserData).toHaveBeenCalledWith(Platform.DCP, { dcp: 'data' });
    });

    it('should handle non-Error types in catch blocks', async () => {
      const stringError = 'String error message';

      mockedHttpUtils.makeAuthenticatedRequest
        .mockRejectedValueOnce(stringError)
        .mockRejectedValueOnce(stringError);

      await expect(fetchGDPRData(mockConfig, 'testuser', 'test@example.com', mockLogger)).rejects.toThrow(GdprError);

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to fetch data from both platforms', {
        dcpError: stringError,
        dxspError: stringError,
      });
    });
  });

  describe('deleteUserDataByPlatform', () => {
    it('should delete user data successfully', async () => {
      const mockResponse = new Response('{"deleted": true}', { status: 200 });
      const mockResult = { deleted: true };

      mockedHttpUtils.makeAuthenticatedRequest.mockResolvedValueOnce(mockResponse);
      mockedHttpUtils.parseJsonResponse.mockResolvedValueOnce(mockResult);

      const result = await deleteUserDataByPlatform(
        mockConfig,
        'user123',
        Platform.DCP,
        mockLogger,
      );

      expect(result).toBe(mockResult);

      expect(mockLogger.info).toHaveBeenCalledWith('Deleting GDPR data from DCP', {
        platform: Platform.DCP,
        apiUrl: mockConfig.dcp.apiBaseUrl,
        uid: 'user123',
      });

      expect(mockLogger.info).toHaveBeenCalledWith('Successfully deleted data from DCP', {
        uid: 'user123',
      });
    });

    it('should make correct API call for DCP platform', async () => {
      const mockResponse = new Response('{"deleted": true}', { status: 200 });

      mockedHttpUtils.makeAuthenticatedRequest.mockResolvedValueOnce(mockResponse);
      mockedHttpUtils.parseJsonResponse.mockResolvedValueOnce({});

      await deleteUserDataByPlatform(mockConfig, 'user123', Platform.DCP, mockLogger);

      expect(mockedHttpUtils.makeAuthenticatedRequest).toHaveBeenCalledWith(
        mockConfig.dcp.apiBaseUrl,
        mockConfig.dcp,
        Platform.DCP,
        {
          method: 'DELETE',
          body: JSON.stringify({ uid: 'user123' }),
        },
        mockLogger,
      );
    });

    it('should make correct API call for DXSP platform', async () => {
      const mockResponse = new Response('{"deleted": true}', { status: 200 });

      mockedHttpUtils.makeAuthenticatedRequest.mockResolvedValueOnce(mockResponse);
      mockedHttpUtils.parseJsonResponse.mockResolvedValueOnce({});

      await deleteUserDataByPlatform(mockConfig, 'user456', Platform.DXSP, mockLogger);

      expect(mockedHttpUtils.makeAuthenticatedRequest).toHaveBeenCalledWith(
        mockConfig.dxsp.apiBaseUrl,
        mockConfig.dxsp,
        Platform.DXSP,
        {
          method: 'DELETE',
          body: JSON.stringify({ uid: 'user456' }),
        },
        mockLogger,
      );
    });

    it('should handle deletion errors and re-throw', async () => {
      const deleteError = new GdprError('Delete failed', Platform.DCP, 404);

      mockedHttpUtils.makeAuthenticatedRequest.mockRejectedValueOnce(deleteError);

      await expect(
        deleteUserDataByPlatform(mockConfig, 'user123', Platform.DCP, mockLogger),
      ).rejects.toThrow(deleteError);

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to delete data from DCP', {
        platform: Platform.DCP,
        uid: 'user123',
        error: deleteError,
      });
    });

    it('should work without logger', async () => {
      const mockResponse = new Response('{"deleted": true}', { status: 200 });
      const mockResult = { deleted: true };

      mockedHttpUtils.makeAuthenticatedRequest.mockResolvedValueOnce(mockResponse);
      mockedHttpUtils.parseJsonResponse.mockResolvedValueOnce(mockResult);

      const result = await deleteUserDataByPlatform(mockConfig, 'user123', Platform.DCP);

      expect(result).toBe(mockResult);
      expect(mockedHttpUtils.makeAuthenticatedRequest).toHaveBeenCalled();
    });

    it('should handle parsing errors', async () => {
      const mockResponse = new Response('{"deleted": true}', { status: 200 });
      const parseError = new GdprError('Parse failed', Platform.DCP, 200);

      mockedHttpUtils.makeAuthenticatedRequest.mockResolvedValueOnce(mockResponse);
      mockedHttpUtils.parseJsonResponse.mockRejectedValueOnce(parseError);

      await expect(
        deleteUserDataByPlatform(mockConfig, 'user123', Platform.DCP, mockLogger),
      ).rejects.toThrow(parseError);

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to delete data from DCP', {
        platform: Platform.DCP,
        uid: 'user123',
        error: parseError,
      });
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network failed');

      mockedHttpUtils.makeAuthenticatedRequest.mockRejectedValueOnce(networkError);

      await expect(
        deleteUserDataByPlatform(mockConfig, 'user123', Platform.DXSP, mockLogger),
      ).rejects.toThrow(networkError);

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to delete data from DXSP', {
        platform: Platform.DXSP,
        uid: 'user123',
        error: networkError,
      });
    });
  });
});
