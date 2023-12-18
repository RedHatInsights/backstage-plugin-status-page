import { TestApiProvider, renderInTestApp } from '@backstage/test-utils';
import { ContainerComponent } from './ContainerComponent';
import React from 'react';
import { OAuthApi } from '@backstage/core-plugin-api';
import { oauth2ApiRef } from '../../plugin';

jest.mock('../ProxyList', () => ({
  ProxyList: () => <></>,
}));

describe('ContainerComponent', () => {
  const mockOauth2Api: Partial<OAuthApi> = {
    getAccessToken: jest.fn().mockImplementation(() => {
      return Promise.resolve('access-token-here');
    }),
  };

  const render = async () =>
    await renderInTestApp(
      <TestApiProvider apis={[[oauth2ApiRef, mockOauth2Api]]}>
        <ContainerComponent />
      </TestApiProvider>,
    );

  it('should render', async () => {
    const rendered = await render();
    expect(rendered).toBeDefined();
  });

  it('should render heading', async () => {
    const rendered = await render();
    expect(
      rendered.getByRole('heading', { name: 'Hydra Proxy', level: 1 }),
    ).toBeInTheDocument();
    expect(
      rendered.getByRole('heading', { name: 'Hydra Proxy', level: 4 }),
    ).toBeInTheDocument();
  });

  it('should render all links properly', async () => {
    const rendered = await render();
    expect(rendered.getByRole('link', { name: 'Hydra Proxy' })).toHaveAttribute(
      'href',
      'https://one.redhat.com/hydra-manager/#/proxy',
    );
    expect(rendered.getByRole('link', { name: 'Team Hydra' })).toHaveAttribute(
      'href',
      '/catalog/redhat/group/hydra-team',
    );
    expect(
      rendered.getByRole('link', { name: 'hydra-dev@redhat.com' }),
    ).toHaveAttribute('href', 'mailto:hydra-dev@redhat.com');
  });
});
