import { TechRadarPage } from '@backstage-community/plugin-tech-radar';
import { ApiExplorerPage, apiDocsPlugin } from '@backstage/plugin-api-docs';
import {
  CatalogEntityPage,
  CatalogIndexPage,
  catalogPlugin,
} from '@backstage/plugin-catalog';
import {
  CatalogImportPage,
  catalogImportPlugin,
} from '@backstage/plugin-catalog-import';
import { orgPlugin } from '@backstage/plugin-org';
import { ScaffolderPage, scaffolderPlugin } from '@backstage/plugin-scaffolder';
import { SearchPage } from '@backstage/plugin-search';
import {
  TechDocsIndexPage,
  TechDocsReaderPage,
  techdocsPlugin,
} from '@backstage/plugin-techdocs';
import { ReportIssue } from '@backstage/plugin-techdocs-module-addons-contrib';
import { TechDocsAddons } from '@backstage/plugin-techdocs-react';
import { UserSettingsPage } from '@backstage/plugin-user-settings';
import React from 'react';
import { Navigate, Route } from 'react-router-dom';
import { apis } from './apis';
import { Root } from './components/Root';
import { entityPage } from './components/catalog/EntityPage';
import { searchPage } from './components/search/SearchPage';

import {
  AuditCompliancePage,
  AuditDetailsSection,
  AuditInitiation,
  AuditSummary,
} from '@appdev-platform/backstage-plugin-audit-compliance';
import {
  AppDevDashboardPage,
  DataLayerDashboardPage,
  PulseDashboardPage,
} from '@appdev-platform/backstage-plugin-devex-dashboard';
import { DocsBotPage } from '@appdev-platform/backstage-plugin-docsbot';
import { HydraSupportDashboardPage } from '@appdev-platform/backstage-plugin-hydra-support-dashboard';
import { McpPage } from '@appdev-platform/backstage-plugin-mcp';
import {
  CreateIncident,
  OutageTemplatePage,
  UpdateIncident,
} from '@appdev-platform/backstage-plugin-outages';
import { ProxyManagerPage } from '@appdev-platform/backstage-plugin-proxy-manager';
import { SpashipGlobalPage } from '@appdev-platform/backstage-plugin-spaship';
import {
  JiraIcon,
  SlackIcon,
} from '@appdev-platform/backstage-plugin-workstream-automation';
import { WORKSTREAM_RELATION_PAIR } from '@appdev-platform/backstage-plugin-workstream-automation-common';
import { MockPluginPage } from '@appdev-platform/plugin-mock-plugin';
import { ReportPortalGlobalPage } from '@backstage-community/plugin-report-portal';
import { createApp } from '@backstage/app-defaults';
import { AppRouter, FlatRoutes } from '@backstage/core-app-api';
import {
  AlertDisplay,
  EmailIcon,
  OAuthRequestDialog,
  SignInPage,
} from '@backstage/core-components';
import { catalogEntityCreatePermission } from '@backstage/plugin-catalog-common/alpha';
import {
  ALL_RELATION_PAIRS,
  CatalogGraphPage,
} from '@backstage/plugin-catalog-graph';
import { CatalogUnprocessedEntitiesPage } from '@backstage/plugin-catalog-unprocessed-entities';
import { DevToolsPage } from '@backstage/plugin-devtools';
import { RequirePermission } from '@backstage/plugin-permission-react';
import {
  GlobalFeedbackPage,
  OpcFeedbackComponent,
  feedbackPlugin,
} from '@janus-idp/backstage-plugin-feedback';
import AdbIcon from '@material-ui/icons/Adb';
import WebLinkIcon from '@material-ui/icons/Language';
import GroupWorkIcon from '@material-ui/icons/GroupWork';
import { getThemes } from '@red-hat-developer-hub/backstage-plugin-theme';
import { SoundcheckRoutingPage } from '@spotify/backstage-plugin-soundcheck';
import { CatalogPage } from './components/CatalogPage/CatalogPage';

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
    'kind:workstream': GroupWorkIcon,
    'kind:art': AdbIcon,
    mail: EmailIcon,
    slack_contact: SlackIcon,
    jira: JiraIcon,
    link: WebLinkIcon,
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
          showArrowHeads
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
    <Route
      path="/hydra-support-dashboard"
      element={<HydraSupportDashboardPage />}
    />
    <Route path="/dashboard/hydra" element={<HydraSupportDashboardPage />} />
    <Route path="/dashboard/app-dev" element={<AppDevDashboardPage />} />
    <Route path="/dashboard/data-layer" element={<DataLayerDashboardPage />} />
    <Route path="/dashboard/compass" element={<PulseDashboardPage />} />
    <Route path="/status-page" element={<OutageTemplatePage />} />
    <Route path="/status-page/create-incident" element={<CreateIncident />} />
    <Route
      path="/status-page/:type/:incident_id"
      element={<UpdateIncident />}
    />
    <Route path="/soundcheck" element={<SoundcheckRoutingPage />} />
    <Route path="/devtools" element={<DevToolsPage />} />
    <Route path="/mcp" element={<McpPage />} />
    <Route path="/audit-compliance" element={<AuditCompliancePage />} />
    <Route path="/audit-compliance/:app_name" element={<AuditInitiation />} />
    <Route
      path="/audit-compliance/:app_name/:frequency/:period/details"
      element={<AuditDetailsSection />}
    />
    <Route
      path="/audit-compliance/:app_name/:frequency/:period/summary"
      element={<AuditSummary />}
    />
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
