import { LoggerService } from '@backstage/backend-plugin-api';
import { Platform, GdprError, DrupalHostConfig } from './types';
import { createBasicAuthHeader, makeAuthenticatedRequest, parseJsonResponse } from './httpUtils';

// Mock global fetch
global.fetch = jest.fn();

describe('httpUtils', () => {
  const mockConfig: DrupalHostConfig = {
    serviceAccount: 'test-service',
    token: 'test-token',
    apiBaseUrl: 'https://test.example.com/api',
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
    (fetch as jest.MockedFunction<typeof fetch>).mockClear();
  });

  describe('createBasicAuthHeader', () => {
    it('should create correct Basic auth header', () => {
      const headers = createBasicAuthHeader(mockConfig);
      
      // Expected base64 encoding of "test-service:test-token"
      const expectedCredentials = Buffer.from('test-service:test-token').toString('base64');
      
      expect(headers).toEqual({
        Authorization: `Basic ${expectedCredentials}`,
        'Content-Type': 'application/json',
      });
    });

    it('should handle special characters in credentials', () => {
      const configWithSpecialChars: DrupalHostConfig = {
        serviceAccount: 'test@service',
        token: 'token:with:colons',
        apiBaseUrl: 'https://test.example.com',
      };

      const headers = createBasicAuthHeader(configWithSpecialChars);
      const expectedCredentials = Buffer.from('test@service:token:with:colons').toString('base64');
      
      expect(headers.Authorization).toBe(`Basic ${expectedCredentials}`);
    });
  });

  describe('makeAuthenticatedRequest', () => {
    it('should make successful authenticated request', async () => {
      const mockResponse = new Response('{"success": true}', { status: 200 });
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse);

      const response = await makeAuthenticatedRequest(
        'https://test.example.com/api',
        mockConfig,
        Platform.DCP,
        { method: 'POST', body: '{"test": true}' },
        mockLogger,
      );

      expect(fetch).toHaveBeenCalledWith('https://test.example.com/api', {
        method: 'POST',
        headers: {
          Authorization: expect.stringContaining('Basic'),
          'Content-Type': 'application/json',
        },
        body: '{"test": true}',
      });

      expect(response).toBe(mockResponse);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Making POST request to DCP',
        expect.objectContaining({
          url: 'https://test.example.com/api',
          platform: Platform.DCP,
          method: 'POST',
        }),
      );
    });

    it('should throw GdprError for HTTP error responses', async () => {
      const mockResponse = new Response('Not Found', { status: 404 });
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse);

      await expect(
        makeAuthenticatedRequest(
          'https://test.example.com/api',
          mockConfig,
          Platform.DXSP,
          { method: 'DELETE', body: '{}' },
          mockLogger,
        ),
      ).rejects.toThrow(GdprError);

      await expect(
        makeAuthenticatedRequest(
          'https://test.example.com/api',
          mockConfig,
          Platform.DXSP,
          { method: 'DELETE', body: '{}' },
          mockLogger,
        ),
      ).rejects.toThrow('DXSP HTTP error! Status: 404');
    });

    it('should throw GdprError for network errors', async () => {
      const networkError = new Error('Network error');
      (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(networkError);

      await expect(
        makeAuthenticatedRequest(
          'https://test.example.com/api',
          mockConfig,
          Platform.DCP,
          { method: 'POST', body: '{}' },
          mockLogger,
        ),
      ).rejects.toThrow(GdprError);

      await expect(
        makeAuthenticatedRequest(
          'https://test.example.com/api',
          mockConfig,
          Platform.DCP,
          { method: 'POST', body: '{}' },
          mockLogger,
        ),
      ).rejects.toThrow('DCP request failed');
    });

    it('should work without logger', async () => {
      const mockResponse = new Response('{"success": true}', { status: 200 });
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse);

      const response = await makeAuthenticatedRequest(
        'https://test.example.com/api',
        mockConfig,
        Platform.DCP,
        { method: 'POST', body: '{}' },
      );

      expect(response).toBe(mockResponse);
      expect(fetch).toHaveBeenCalled();
    });
  });

  describe('parseJsonResponse', () => {
    it('should parse valid JSON response', async () => {
      const responseData = { message: 'success', data: [1, 2, 3] };
      const mockResponse = new Response(JSON.stringify(responseData), { status: 200 });

      const result = await parseJsonResponse(mockResponse, Platform.DCP);

      expect(result).toEqual(responseData);
    });

    it('should throw GdprError for invalid JSON', async () => {
      const mockResponse = new Response('invalid json', { status: 200 });

      await expect(
        parseJsonResponse(mockResponse, Platform.DXSP),
      ).rejects.toThrow(GdprError);

      await expect(
        parseJsonResponse(mockResponse, Platform.DXSP),
      ).rejects.toThrow('Failed to parse JSON response from DXSP');
    });

    it('should include original error in GdprError', async () => {
      const mockResponse = new Response('invalid json', { status: 500 });

      let thrownError: GdprError | undefined;
      
      try {
        await parseJsonResponse(mockResponse, Platform.DCP);
      } catch (error) {
        thrownError = error as GdprError;
      }

      expect(thrownError).toBeInstanceOf(GdprError);
      expect(thrownError!.platform).toBe(Platform.DCP);
      expect(thrownError!.statusCode).toBe(500);
      expect(thrownError!.originalError).toBeInstanceOf(Error);
    });

    it('should handle empty response', async () => {
      const mockResponse = new Response('{}', { status: 200 });

      const result = await parseJsonResponse(mockResponse, Platform.DCP);

      expect(result).toEqual({});
    });
  });
});
