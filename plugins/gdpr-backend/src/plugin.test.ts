import { mockServices, startTestBackend } from '@backstage/backend-test-utils';
import { gdprPlugin } from './plugin';

describe('gdprPlugin', () => {
  it('should start successfully', async () => {
    const backend = await startTestBackend({
      features: [
        gdprPlugin,
        mockServices.rootConfig.factory({
          data: {
            gdpr: {
              dcp: {
                token: 'test-dcp-token',
                apiBaseUrl: 'https://test-dcp.example.com/api',
                serviceAccount: 'test-dcp-service',
              },
              dxsp: {
                token: 'test-dxsp-token',
                apiBaseUrl: 'https://test-dxsp.example.com/api',
                serviceAccount: 'test-dxsp-service',
              },
            },
          },
        }),
      ],
    });

    expect(backend).toBeDefined();
    await backend.stop();
  });

  it('should fail to start with missing configuration', async () => {
    await expect(
      startTestBackend({
        features: [
          gdprPlugin,
          mockServices.rootConfig.factory({
            data: {
              // Missing gdpr config
            },
          }),
        ],
      }),
    ).rejects.toThrow();
  });

  it('should fail to start with incomplete DCP configuration', async () => {
    await expect(
      startTestBackend({
        features: [
          gdprPlugin,
          mockServices.rootConfig.factory({
            data: {
              gdpr: {
                dcp: {
                  // Missing required properties
                  token: 'test-token',
                },
                dxsp: {
                  token: 'test-dxsp-token',
                  apiBaseUrl: 'https://test-dxsp.example.com/api',
                  serviceAccount: 'test-dxsp-service',
                },
              },
            },
          }),
        ],
      }),
    ).rejects.toThrow();
  });

  it('should fail to start with incomplete DXSP configuration', async () => {
    await expect(
      startTestBackend({
        features: [
          gdprPlugin,
          mockServices.rootConfig.factory({
            data: {
              gdpr: {
                dcp: {
                  token: 'test-dcp-token',
                  apiBaseUrl: 'https://test-dcp.example.com/api',
                  serviceAccount: 'test-dcp-service',
                },
                dxsp: {
                  // Missing required properties
                  token: 'test-token',
                },
              },
            },
          }),
        ],
      }),
    ).rejects.toThrow();
  });
});
