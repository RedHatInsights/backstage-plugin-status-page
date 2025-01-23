import React from 'react';
import { Navigate, Route } from 'react-router-dom';
import { apiDocsPlugin, ApiExplorerPage } from '@backstage/plugin-api-docs';
import {
  CatalogEntityPage,
  CatalogIndexPage,
  catalogPlugin,
} from '@backstage/plugin-catalog';
import {
  CatalogImportPage,
  catalogImportPlugin,
} from '@backstage/plugin-catalog-import';
import { ScaffolderPage, scaffolderPlugin } from '@backstage/plugin-scaffolder';
import { orgPlugin } from '@backstage/plugin-org';
import { SearchPage } from '@backstage/plugin-search';
import { TechRadarPage } from '@backstage/plugin-tech-radar';
import {
  TechDocsIndexPage,
  techdocsPlugin,
  TechDocsReaderPage,
} from '@backstage/plugin-techdocs';
import { TechDocsAddons } from '@backstage/plugin-techdocs-react';
import { ReportIssue } from '@backstage/plugin-techdocs-module-addons-contrib';
import { UserSettingsPage } from '@backstage/plugin-user-settings';
import { apis } from './apis';
import { entityPage } from './components/catalog/EntityPage';
import { searchPage } from './components/search/SearchPage';
import { Root } from './components/Root';

import {
  AlertDisplay,
  EmailIcon,
  OAuthRequestDialog,
  SignInPage,
} from '@backstage/core-components';
import { createApp } from '@backstage/app-defaults';
import { AppRouter, FlatRoutes } from '@backstage/core-app-api';
import {
  ALL_RELATION_PAIRS,
  CatalogGraphPage,
} from '@backstage/plugin-catalog-graph';
import { RequirePermission } from '@backstage/plugin-permission-react';
import { catalogEntityCreatePermission } from '@backstage/plugin-catalog-common/alpha';
import { SpashipGlobalPage } from '@appdev-platform/backstage-plugin-spaship';
import { ProxyManagerPage } from '@appdev-platform/backstage-plugin-proxy-manager';
import { CatalogPage } from './components/CatalogPage/CatalogPage';
import {
  GlobalFeedbackPage,
  OpcFeedbackComponent,
  feedbackPlugin,
} from '@janus-idp/backstage-plugin-feedback';
import { MockPluginPage } from '@appdev-platform/plugin-mock-plugin';
import { CatalogUnprocessedEntitiesPage } from '@backstage/plugin-catalog-unprocessed-entities';
import { ReportPortalGlobalPage } from '@backstage-community/plugin-report-portal';
import { DocsBotPage } from '@appdev-platform/backstage-plugin-docsbot';
import {
  JiraIcon,
  SlackIcon,
} from '@appdev-platform/backstage-plugin-workstream-automation';
import { getThemes } from '@redhat-developer/red-hat-developer-hub-theme';
import SettingsEthernet from '@material-ui/icons/SettingsEthernet';
import { HydraSupportDashboardPage } from '@appdev-platform/backstage-plugin-hydra-support-dashboard';
import { WORKSTREAM_RELATION_PAIR } from '@appdev-platform/backstage-plugin-workstream-automation-common';
import WebLinkIcon from '@material-ui/icons/Language';
import { OutageTemplatePage } from '@appdev-platform/backstage-plugin-outage-template';

const app = createApp({
  apis,
  bindRoutes({ bind }) {
    bind(catalogPlugin.externalRoutes, {
      createComponent: scaffolderPlugin.routes.root,
      viewTechDoc: techdocsPlugin.routes.docRoot,
    });
    bind(apiDocsPlugin.externalRoutes, {
      registerApi: catalogImportPlugin.routes.importPage,
    });
    bind(scaffolderPlugin.externalRoutes, {
      registerComponent: catalogImportPlugin.routes.importPage,
    });
    bind(orgPlugin.externalRoutes, {
      catalogIndex: catalogPlugin.routes.catalogIndex,
    });
    bind(feedbackPlugin.externalRoutes, {
      viewDocs: techdocsPlugin.routes.root,
    });
  },
  components: {
    SignInPage: props => <SignInPage {...props} auto providers={['guest']} />,
  },
  featureFlags: [
    {
      name: 'default-catalog-index',
      pluginId: 'catalog-index',
      description: 'Fall back to the default catalog index page.',
    },
  ],
  icons: {
    'kind:workstream': SettingsEthernet,
    mail: EmailIcon,
    slack_contact: SlackIcon,
    jira: JiraIcon,
    link: WebLinkIcon
  },
  themes: getThemes(),
});

const routes = (
  <FlatRoutes>
    <Route path="/" element={<Navigate to="catalog" />} />
    <Route path="/catalog" element={<CatalogIndexPage />}>
      <CatalogPage />
    </Route>
    <Route
      path="/catalog/:namespace/:kind/:name"
      element={<CatalogEntityPage />}
    >
      {entityPage}
    </Route>
    <Route path="/docs" element={<TechDocsIndexPage />} />
    <Route
      path="/docs/:namespace/:kind/:name/*"
      element={<TechDocsReaderPage />}
    >
      <TechDocsAddons>
        <ReportIssue />
      </TechDocsAddons>
    </Route>
    <Route path="/create" element={<ScaffolderPage />} />
    <Route path="/api-docs" element={<ApiExplorerPage />} />
    <Route
      path="/tech-radar"
      element={<TechRadarPage width={1500} height={800} />}
    />
    <Route
      path="/catalog-import"
      element={
        <RequirePermission permission={catalogEntityCreatePermission}>
          <CatalogImportPage />
        </RequirePermission>
      }
    />
    <Route path="/search" element={<SearchPage />}>
      {searchPage}
    </Route>
    <Route path="/settings" element={<UserSettingsPage />} />
    <Route
      path="/catalog-graph"
      element={
        <CatalogGraphPage
          relationPairs={[WORKSTREAM_RELATION_PAIR, ...ALL_RELATION_PAIRS]}
        />
      }
    />
    <Route path="/spaship" element={<SpashipGlobalPage />} />
    <Route path="/proxy-manager" element={<ProxyManagerPage />} />
    <Route path="/feedback" element={<GlobalFeedbackPage />} />
    <Route path="/mock-plugin" element={<MockPluginPage />} />
    <Route path="/report-portal" element={<ReportPortalGlobalPage />} />
    <Route
      path="/catalog-unprocessed-entities"
      element={<CatalogUnprocessedEntitiesPage />}
    />
    <Route path="/docsbot" element={<DocsBotPage />} />
    <Route
      path="/hydra-support-dashboard"
      element={<HydraSupportDashboardPage />}
    />
    <Route path="/outage-template" element={<OutageTemplatePage />} />
  </FlatRoutes>
);

export default app.createRoot(
  <>
    <AlertDisplay />
    <OAuthRequestDialog />
    <AppRouter>
      <Root>{routes}</Root>
      <OpcFeedbackComponent />
    </AppRouter>
  </>,
);
