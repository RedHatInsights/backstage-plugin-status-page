import { OAuthApi, configApiRef } from '@backstage/core-plugin-api';
import {
  MockConfigApi,
  TestApiProvider,
  renderInTestApp,
} from '@backstage/test-utils';
import { ProxyList } from './ProxyList';
import { oauth2ApiRef } from '../../plugin';

describe('ProxyList', () => {
  const mockOauth2Api: Partial<OAuthApi> = {
    getAccessToken: jest.fn().mockImplementation(() => {
      return Promise.resolve('access-token-here');
    }),
  };
  const mockConfigApi = new MockConfigApi({
    proxyManager: {
      apiBaseUrl: 'mock',
    },
  });
  const render = async () =>
    await renderInTestApp(
      <TestApiProvider
        apis={[
          [configApiRef, mockConfigApi],
          [oauth2ApiRef, mockOauth2Api],
        ]}
      >
        <ProxyList />
      </TestApiProvider>,
    );

  it('should render', async () => {
    const rendered = await render();

    expect(rendered).toBeDefined();
  });

  it('should render table', async () => {
    const rendered = await render();
    expect(rendered.getByRole('textbox')).toHaveAttribute(
      'placeholder',
      'search proxy',
    );
    expect(
      rendered.getByRole('row', { name: 'No Proxies' }),
    ).toBeInTheDocument();
    expect(
      rendered.getByRole('cell', { name: 'No Proxies' }),
    ).toBeInTheDocument();
    expect(
      rendered.getByRole('columnheader', { name: 'URL Suffix' }),
    ).toBeInTheDocument();
    expect(
      rendered.getByRole('columnheader', { name: 'Destination URL' }),
    ).toBeInTheDocument();
    expect(
      rendered.getByRole('columnheader', { name: 'Authentication' }),
    ).toBeInTheDocument();
    expect(
      rendered.getByRole('columnheader', { name: 'Proxy Type' }),
    ).toBeInTheDocument();
    expect(
      rendered.getByRole('columnheader', { name: 'Status' }),
    ).toBeInTheDocument();
    expect(
      rendered.getByRole('columnheader', { name: 'Owner' }),
    ).toBeInTheDocument();
  });

  it('should render all buttons', async () => {
    const rendered = await render();
    expect(
      rendered.getByRole('button', { name: 'Go to previous page' }),
    ).toBeInTheDocument();
    expect(
      rendered.getByRole('button', { name: 'Go to next page' }),
    ).toBeInTheDocument();
  });
});
