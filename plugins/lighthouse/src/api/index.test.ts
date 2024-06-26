import { LighthouseApiClient } from './index';
import { FetchApi, IdentityApi } from '@backstage/core-plugin-api';
import { MockConfigApi } from '@backstage/test-utils';

describe('LighthouseApiClient', () => {
  let client: LighthouseApiClient;
  const mockConfigApi = new MockConfigApi({
    backend: { baseUrl: 'https://localhost:7007' },
  });
  const identityApi: jest.Mocked<IdentityApi> = {
    getCredentials: jest.fn(),
  } as unknown as jest.Mocked<IdentityApi>;
  const mockFetchApi = {
    fetch: jest.fn(),
  } as unknown as jest.Mocked<FetchApi>;

  beforeEach(() => {
    jest.resetAllMocks();
    mockFetchApi.fetch.mockClear();
    identityApi.getCredentials.mockResolvedValue({ token: undefined });
    client = new LighthouseApiClient({
      configApi: mockConfigApi,
      fetchApi: mockFetchApi,
    });
  });

  it('should create an instance', () => {
    expect(client).toBeDefined();
  });

  it('should get projects', async () => {
    mockFetchApi.fetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          { id: '1', name: 'Project 1' },
          { id: '2', name: 'Project 2' },
        ]),
      ),
    );

    const projects = await client.getProjects('slug');
    expect(projects).toEqual([
      { id: '1', name: 'Project 1' },
      { id: '2', name: 'Project 2' },
    ]);
  });

  it('should get project builds', async () => {
    const mockBuilds = [
      { id: '1', name: 'Build 1' },
      { id: '2', name: 'Build 2' },
    ];
    mockFetchApi.fetch.mockResolvedValueOnce(
      new Response(JSON.stringify(mockBuilds)),
    );

    const builds = await client.getProjectBuilds('1');
    expect(builds).toEqual(mockBuilds);
  });

  it('should get project build URLs', async () => {
    const mockUrls = [
      { url: 'http://example.lighthouse.com/build1' },
      { url: 'http://example.lighthouse.com/build2' },
    ];

    mockFetchApi.fetch.mockResolvedValueOnce(
      new Response(JSON.stringify(mockUrls)),
    );
    const urls = await client.getProjectBuildUrls('1', '1');
    expect(urls).toEqual(mockUrls);
  });

  it('should get project branches', async () => {
    const mockBranches = [{ branch: 'main' }, { branch: 'develop' }];

    mockFetchApi.fetch.mockResolvedValueOnce(
      new Response(JSON.stringify(mockBranches)),
    );

    const branches = await client.getProjectBranches('1');
    expect(branches).toEqual(mockBranches);
  });

  it('should get project build run scores', async () => {
    const mockResponse = [
      {
        lhr: JSON.stringify({
          categories: {
            performance: { score: 0.9 },
            accessibility: { score: 0.8 },
          },
        }),
      },
    ];

    mockFetchApi.fetch.mockResolvedValueOnce(
      new Response(JSON.stringify(mockResponse)),
    );

    const scores = await client.getProjectBuildRun(
      '1',
      '1',
      'http://example.lighthouse.com',
    );
    expect(scores).toEqual({ performance: 90, accessibility: 80 });
  });
});
