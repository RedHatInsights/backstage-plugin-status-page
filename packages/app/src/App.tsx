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
  ComplianceManagerPageNew,
} from '@appdev/backstage-plugin-audit-compliance';
import { CompliancePage } from '@appdev/backstage-plugin-compliance';
import {
  AppDevDashboardPage,
  DataLayerDashboardPage,
  PulseDashboardPage,
} from '@appdev/backstage-plugin-devex-dashboard';
import { DocsBotPage } from '@appdev/backstage-plugin-docsbot';
import { DoraMetricsPage } from '@appdev/backstage-plugin-dora-metrics';
import { EssPage, PlatformDetailPage } from '@appdev/backstage-plugin-ess';
import { GdprPage } from '@appdev/backstage-plugin-gdpr';
import { HydraSupportDashboardPage } from '@appdev/backstage-plugin-hydra-support-dashboard';
import {
  CreateIncident,
  OutageTemplatePage,
  UpdateIncident,
} from '@appdev/backstage-plugin-outages';
import { PermissionManagementPage } from '@appdev/backstage-plugin-permission-management';
import { ProxyManagerPage } from '@appdev/backstage-plugin-proxy-manager';
import { SpashipGlobalPage } from '@appdev/backstage-plugin-spaship';
import { EntityValidationPage } from '@backstage-community/plugin-entity-validation';
import {
  GlobalFeedbackComponent,
  GlobalFeedbackPage,
  feedbackPlugin,
} from '@backstage-community/plugin-feedback';
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
import { ScaffolderFieldExtensions } from '@backstage/plugin-scaffolder-react';
import { SignalsDisplay } from '@backstage/plugin-signals';
import {
  AssistantProvider,
  featureFlags as assistantFeatureFlags,
} from '@compass/backstage-plugin-assistant';
import {
  EntityFacetPickerFieldExtension,
  datasourcePlugin,
} from '@compass/backstage-plugin-datasource';
import {
  DockerIcon,
  MCPServerIcon,
  MistralIcon,
  NPMIcon,
  PythonIcon,
} from '@compass/backstage-plugin-mcp';
import {
  RedirectsProvider,
  redirectsPlugin,
} from '@compass/backstage-plugin-redirects';
import {
  JiraIcon,
  SlackIcon,
  WorkstreamDashboardPage,
} from '@compass/backstage-plugin-workstream-automation';
import { WORKSTREAM_RELATION_PAIR } from '@compass/backstage-plugin-workstream-automation-common';
import { MockPluginPage } from '@compass/plugin-mock-plugin';
import AdbIcon from '@material-ui/icons/Adb';
import CategoryOutlinedIcon from '@material-ui/icons/CategoryOutlined';
import GroupWorkIcon from '@material-ui/icons/GroupWork';
import WebLinkIcon from '@material-ui/icons/Language';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import CreateComponentIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import Logout from '@mui/icons-material/LogoutOutlined';
import ManageAccounts from '@mui/icons-material/ManageAccountsOutlined';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import { getThemes } from '@red-hat-developer-hub/backstage-plugin-theme';
import { SoundcheckRoutingPage } from '@spotify/backstage-plugin-soundcheck';
import { CatalogPage } from './components/CatalogPage/CatalogPage';
import { SoundcheckPaginationStylesFix } from './components/Root/components/SoundcheckPaginationFix';

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
    bind(redirectsPlugin.externalRoutes, {
      techDocsDetails: techdocsPlugin.routes.docRoot,
      catalogDetails: catalogPlugin.routes.catalogEntity,
    });
  },
  components: {
    SignInPage: props => <SignInPage {...props} auto providers={['guest']} />,
  },
  featureFlags: [assistantFeatureFlags.debug],
  icons: {
    'kind:workstream': GroupWorkIcon,
    'kind:art': AdbIcon,
    mail: EmailIcon,
    slack_contact: SlackIcon,
    jira: JiraIcon,
    link: WebLinkIcon,
    'kind:mcpserver': MCPServerIcon,
    npm: NPMIcon,
    python: PythonIcon,
    docker: DockerIcon,
    mistral: MistralIcon,
    manageAccounts: ManageAccounts,
    account: AccountCircleOutlinedIcon,
    logout: Logout,
    category: CategoryOutlinedIcon,
    notifications: NotificationsOutlinedIcon,
    create: CreateComponentIcon,
  },
  themes: getThemes(),
  plugins: [datasourcePlugin],
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
    <Route path="/create" element={<ScaffolderPage />}>
      <ScaffolderFieldExtensions>
        <EntityFacetPickerFieldExtension />
      </ScaffolderFieldExtensions>
    </Route>
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
    <Route path="/compliance/gdpr" element={<GdprPage />} />
    <Route
      path="/soundcheck"
      element={
        <>
          <SoundcheckPaginationStylesFix /> <SoundcheckRoutingPage />
        </>
      }
    />
    <Route path="/devtools" element={<DevToolsPage />} />
    <Route path="/audit-access-manager" element={<AuditCompliancePage />} />
    <Route
      path="/audit-access-manager/compliance-manager"
      element={<ComplianceManagerPageNew />}
    />
    <Route
      path="/audit-access-manager/:app_name"
      element={<AuditInitiation />}
    />
    <Route
      path="/audit-access-manager/:app_name/:frequency/:period/details"
      element={<AuditDetailsSection />}
    />
    <Route
      path="/audit-access-manager/:app_name/:frequency/:period/summary"
      element={<AuditSummary />}
    />
    <Route
      path="/hydra-permission-management"
      element={<PermissionManagementPage />}
    />
    <Route path="/compliance" element={<CompliancePage />} />

    <Route path="/compliance/ess" element={<EssPage />} />
    <Route
      path="/compliance/ess/platform/:name"
      element={<PlatformDetailPage />}
    />
    <Route path="/workstream/dashboard" element={<WorkstreamDashboardPage />} />
    <Route
      path="/workstream"
      element={<Navigate to="/catalog?filter[kind]=Workstream" />}
    />
    <Route
      path="/entity-validator"
      element={<EntityValidationPage hideFileLocationField />}
    />
    <Route path="/dora-metrics" element={<DoraMetricsPage />} />
  </FlatRoutes>
);

export default app.createRoot(
  <>
    <AlertDisplay />
    <OAuthRequestDialog />
    <SignalsDisplay />
    <AppRouter>
      <RedirectsProvider>
        <AssistantProvider>
          <Root>{routes}</Root>
        </AssistantProvider>
      </RedirectsProvider>
      <GlobalFeedbackComponent />
    </AppRouter>
  </>,
);
