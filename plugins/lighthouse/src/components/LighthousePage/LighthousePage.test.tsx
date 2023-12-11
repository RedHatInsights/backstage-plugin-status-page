import { Entity } from '@backstage/catalog-model';
import { renderInTestApp, TestApiProvider } from '@backstage/test-utils';
import { LighthouseApiClient, lighthouseApiRef } from '../../api';
import { CatalogApi, EntityProvider } from '@backstage/plugin-catalog-react';
import React from 'react';
import { LighthouseHomePage } from './LighthousePage';

const entityComponent: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'example-website-for-lighthouse-plugin',
    annotations: {
      'lighthouse.io/project-name': 'test.example.com',
    },
  }
};

const mockCatalogApi = {
  getEntities: () => ({}),
} as CatalogApi;

const mockApi = {
  getProjects: () => ({
    "id": "e58ee7c3-272b-47fb-99dc-174595632794",
    "name": "test.example.com",
    "slug": "test.example.com",
    "externalUrl": "https://github.com/1-Platform/one-platform",
    "token": "",
    "baseBranch": "master",
    "adminToken": "",
    "createdAt": "2021-12-18T04:05:31.363Z",
    "updatedAt": "2021-12-18T04:05:31.363Z"
  }),
  getProjectBuilds: () => ([{
    "id": "ce1a20db-cda9-4e99-a060-f69c96f521f4",
    "projectId": "e58ee7c3-272b-47fb-99dc-174595632794",
    "lifecycle": "sealed",
    "hash": "730db861b6fed5b49b0f94970e0570ac52c28793",
    "branch": "Home",
    "commitMessage": "New doc spa (#1597)",
    "author": "Rigin Oommen <roommen@redhat.com>",
    "avatarUrl": "https://www.gravatar.com/avatar/fcbafacb21c2214773f74d952d5047b1.jpg?d=identicon",
    "ancestorHash": "730db861b6fed5b49b0f94970e0570ac52c28793",
    "externalBuildUrl": "",
    "runAt": "2022-08-29T07:37:59.152Z",
    "committedAt": "2022-08-29T07:12:14.000Z",
    "ancestorCommittedAt": "2022-08-29T07:12:14.000Z",
    "createdAt": "2022-08-29T07:38:00.114Z",
    "updatedAt": "2022-08-29T07:38:04.079Z"
  }]),
  getProjectBuildUrls: () => ([
    {
      "url": "https://test.example.com/"
    },
  ]),
  getProjectBranches: () => ([
    {
      "branch": "main"
    },
  ]),
  getProjectBuildRun: () => ([
    {
      "id": "52d8d652-b894-415d-ac93-27b1cd5588af",
      "projectId": "e58ee7c3-272b-47fb-99dc-174595632794",
      "buildId": "ce1a20db-cda9-4e99-a060-f69c96f521f4",
      "representative": true,
      "url": "https://test.example.com/",
      "lhr": "{userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.41 Safari/537.36',…}",
      "createdAt": "2022-08-29T07:38:01.854Z",
      "updatedAt": "2022-08-29T07:38:05.099Z"
    }
  ]),
} as unknown as LighthouseApiClient;
const apis = [
  [lighthouseApiRef, mockCatalogApi, mockApi],
] as const;

describe('LighthouseHomePage', () => {
  it('renders the component', async () => {
    const component = await renderInTestApp(
      <TestApiProvider apis={apis as any}>
        <EntityProvider entity={entityComponent}>
          <LighthouseHomePage />
        </EntityProvider>
      </TestApiProvider>,
    );
    expect(component.getByText(/Builds/i)).toBeInTheDocument();
    expect(component.getByText(/Score Card/i)).toBeInTheDocument();
    expect(component.getByText(/slug/i)).toBeInTheDocument();
  });
});

