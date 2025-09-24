import { Config } from '@backstage/config';
import { readDrupalConfig } from './config';

describe('config', () => {
  describe('readDrupalConfig', () => {
    let mockConfig: jest.Mocked<Config>;
    let mockGdprConfig: jest.Mocked<Config>;
    let mockDcpConfig: jest.Mocked<Config>;
    let mockDxspConfig: jest.Mocked<Config>;
    let mockCppgConfig: jest.Mocked<Config>;
    let mockCphubConfig: jest.Mocked<Config>;

    beforeEach(() => {
      mockDcpConfig = {
        getString: jest.fn(),
        getConfig: jest.fn(),
      } as unknown as jest.Mocked<Config>;

      mockDxspConfig = {
        getString: jest.fn(),
        getConfig: jest.fn(),
      } as unknown as jest.Mocked<Config>;

      mockCppgConfig = {
        getString: jest.fn(),
        getConfig: jest.fn(),
      } as unknown as jest.Mocked<Config>;

      mockCphubConfig = {
        getString: jest.fn(),
        getConfig: jest.fn(),
      } as unknown as jest.Mocked<Config>;

      mockGdprConfig = {
        getConfig: jest.fn(),
        getString: jest.fn(),
      } as unknown as jest.Mocked<Config>;

      mockConfig = {
        getConfig: jest.fn(),
        getString: jest.fn(),
      } as unknown as jest.Mocked<Config>;

      mockConfig.getConfig.mockReturnValue(mockGdprConfig);
      mockGdprConfig.getConfig.mockImplementation((key: string) => {
        if (key === 'dcp') return mockDcpConfig;
        if (key === 'dxsp') return mockDxspConfig;
        if (key === 'cppg') return mockCppgConfig;
        if (key === 'cphub') return mockCphubConfig;
        throw new Error(`Unknown config key: ${key}`);
      });
    });

    it('should read complete GDPR configuration', () => {
      // Setup DCP config
      mockDcpConfig.getString.mockImplementation((key: string) => {
        switch (key) {
          case 'token':
            return 'dcp-token-123';
          case 'apiBaseUrl':
            return 'https://dcp.example.com/api';
          case 'serviceAccount':
            return 'dcp-service';
          default:
            throw new Error(`Unknown DCP config key: ${key}`);
        }
      });

      // Setup DXSP config
      mockDxspConfig.getString.mockImplementation((key: string) => {
        switch (key) {
          case 'token':
            return 'dxsp-token-456';
          case 'apiBaseUrl':
            return 'https://dxsp.example.com/api';
          case 'serviceAccount':
            return 'dxsp-service';
          default:
            throw new Error(`Unknown DXSP config key: ${key}`);
        }
      });

      // Setup CPPG config
      mockCppgConfig.getString.mockImplementation((key: string) => {
        switch (key) {
          case 'token':
            return 'cppg-token-789';
          case 'apiBaseUrl':
            return 'https://cppg.example.com/api';
          case 'serviceAccount':
            return 'cppg-service';
          default:
            throw new Error(`Unknown CPPG config key: ${key}`);
        }
      });

      // Setup CPHUB config
      mockCphubConfig.getString.mockImplementation((key: string) => {
        switch (key) {
          case 'token':
            return 'cphub-token-101';
          case 'apiBaseUrl':
            return 'https://cphub.example.com/api';
          case 'serviceAccount':
            return 'cphub-service';
          default:
            throw new Error(`Unknown CPHUB config key: ${key}`);
        }
      });

      const result = readDrupalConfig(mockConfig);

      expect(result).toEqual({
        dcp: {
          token: 'dcp-token-123',
          apiBaseUrl: 'https://dcp.example.com/api',
          serviceAccount: 'dcp-service',
        },
        dxsp: {
          token: 'dxsp-token-456',
          apiBaseUrl: 'https://dxsp.example.com/api',
          serviceAccount: 'dxsp-service',
        },
        cppg: {
          token: 'cppg-token-789',
          apiBaseUrl: 'https://cppg.example.com/api',
          serviceAccount: 'cppg-service',
        },
        cphub: {
          token: 'cphub-token-101',
          apiBaseUrl: 'https://cphub.example.com/api',
          serviceAccount: 'cphub-service',
        },
      });

      // Verify proper config access
      expect(mockConfig.getConfig).toHaveBeenCalledWith('gdpr');
      expect(mockGdprConfig.getConfig).toHaveBeenCalledWith('dcp');
      expect(mockGdprConfig.getConfig).toHaveBeenCalledWith('dxsp');
      expect(mockGdprConfig.getConfig).toHaveBeenCalledWith('cppg');
      expect(mockGdprConfig.getConfig).toHaveBeenCalledWith('cphub');
      
      // Verify DCP config reads
      expect(mockDcpConfig.getString).toHaveBeenCalledWith('token');
      expect(mockDcpConfig.getString).toHaveBeenCalledWith('apiBaseUrl');
      expect(mockDcpConfig.getString).toHaveBeenCalledWith('serviceAccount');
      
      // Verify DXSP config reads
      expect(mockDxspConfig.getString).toHaveBeenCalledWith('token');
      expect(mockDxspConfig.getString).toHaveBeenCalledWith('apiBaseUrl');
      expect(mockDxspConfig.getString).toHaveBeenCalledWith('serviceAccount');
      
      // Verify CPPG config reads
      expect(mockCppgConfig.getString).toHaveBeenCalledWith('token');
      expect(mockCppgConfig.getString).toHaveBeenCalledWith('apiBaseUrl');
      expect(mockCppgConfig.getString).toHaveBeenCalledWith('serviceAccount');
      
      // Verify CPHUB config reads
      expect(mockCphubConfig.getString).toHaveBeenCalledWith('token');
      expect(mockCphubConfig.getString).toHaveBeenCalledWith('apiBaseUrl');
      expect(mockCphubConfig.getString).toHaveBeenCalledWith('serviceAccount');
    });

    it('should throw error when gdpr config is missing', () => {
      mockConfig.getConfig.mockImplementation(() => {
        throw new Error('Configuration not found');
      });

      expect(() => readDrupalConfig(mockConfig)).toThrow('Configuration not found');
    });

    it('should throw error when dcp config is missing', () => {
      mockGdprConfig.getConfig.mockImplementation((key: string) => {
        if (key === 'dcp') {
          throw new Error('DCP configuration not found');
        }
        return mockDxspConfig;
      });

      expect(() => readDrupalConfig(mockConfig)).toThrow('DCP configuration not found');
    });

    it('should throw error when dxsp config is missing', () => {
      mockGdprConfig.getConfig.mockImplementation((key: string) => {
        if (key === 'dxsp') {
          throw new Error('DXSP configuration not found');
        }
        return mockDcpConfig;
      });

      expect(() => readDrupalConfig(mockConfig)).toThrow('DXSP configuration not found');
    });

    it('should throw error when required DCP properties are missing', () => {
      mockDcpConfig.getString.mockImplementation((key: string) => {
        if (key === 'token') {
          throw new Error('DCP token not configured');
        }
        return 'test-value';
      });

      mockDxspConfig.getString.mockReturnValue('test-value');

      expect(() => readDrupalConfig(mockConfig)).toThrow('DCP token not configured');
    });

    it('should throw error when required DXSP properties are missing', () => {
      mockDcpConfig.getString.mockReturnValue('test-value');
      
      mockDxspConfig.getString.mockImplementation((key: string) => {
        if (key === 'apiBaseUrl') {
          throw new Error('DXSP apiBaseUrl not configured');
        }
        return 'test-value';
      });

      expect(() => readDrupalConfig(mockConfig)).toThrow('DXSP apiBaseUrl not configured');
    });

    it('should handle empty string values', () => {
      mockDcpConfig.getString.mockReturnValue('');
      mockDxspConfig.getString.mockReturnValue('');

      const result = readDrupalConfig(mockConfig);

      expect(result).toEqual({
        dcp: {
          token: '',
          apiBaseUrl: '',
          serviceAccount: '',
        },
        dxsp: {
          token: '',
          apiBaseUrl: '',
          serviceAccount: '',
        },
      });
    });

    it('should handle special characters in configuration values', () => {
      mockDcpConfig.getString.mockImplementation((key: string) => {
        switch (key) {
          case 'token':
            return 'token-with-special-chars!@#$%^&*()';
          case 'apiBaseUrl':
            return 'https://api.example.com/v1/endpoint?param=value&other=test';
          case 'serviceAccount':
            return 'service@account.com';
          default:
            return 'default';
        }
      });

      mockDxspConfig.getString.mockReturnValue('test');

      const result = readDrupalConfig(mockConfig);

      expect(result.dcp.token).toBe('token-with-special-chars!@#$%^&*()');
      expect(result.dcp.apiBaseUrl).toBe('https://api.example.com/v1/endpoint?param=value&other=test');
      expect(result.dcp.serviceAccount).toBe('service@account.com');
    });
  });
});
