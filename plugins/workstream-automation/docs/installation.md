# Installation

## Backend Installation

### Obtain the plugin

Add the workstream automation backend plugin to your Backstage backend app:

```shell
yarn workspace backend add @appdev-platform/backstage-plugin-workstream-automation-backend
```

After installing the plugin enable it from `app-config.yaml`

```yaml title="app-config.yaml"
workstream:
  enabled: true
```

### Integrate the plugin

- First create a custom url reader service factory, To allow reading catalog entites from `/api/workstream/:workstream-name` location:

  ```ts title="packages/backend/src/service/urlReader/index.ts"
  import { WorkstreamUrlReader } from '@appdev-platform/backstage-plugin-workstream-automation-backend';
  import { UrlReaders } from '@backstage/backend-defaults/urlReader';
  import {
    coreServices,
    createServiceFactory,
  } from '@backstage/backend-plugin-api';

  export const urlReaderServiceFactory = createServiceFactory({
    service: coreServices.urlReader,
    deps: {
      config: coreServices.rootConfig,
      logger: coreServices.logger,
      auth: coreServices.auth,
      discovery: coreServices.discovery,
    },
    async factory({ config, logger, auth, discovery }) {
      return UrlReaders.default({
        config,
        logger,
        factories: [await WorkstreamUrlReader.getFactory(auth, discovery)],
      });
    },
  });
  ```

- To integrate the workstream automation backend plugin with backstage, We will need to create specialazied backend and add custom url reader to it:

  ```ts title="packages/backend/src/index.ts"
  import { authServiceFactory } from '@backstage/backend-defaults/auth';
  import { cacheServiceFactory } from '@backstage/backend-defaults/cache';
  import { databaseServiceFactory } from '@backstage/backend-defaults/database';
  import { discoveryServiceFactory } from '@backstage/backend-defaults/discovery';
  import { httpAuthServiceFactory } from '@backstage/backend-defaults/httpAuth';
  import { httpRouterServiceFactory } from '@backstage/backend-defaults/httpRouter';
  import { lifecycleServiceFactory } from '@backstage/backend-defaults/lifecycle';
  import { loggerServiceFactory } from '@backstage/backend-defaults/logger';
  import { permissionsServiceFactory } from '@backstage/backend-defaults/permissions';
  import { rootConfigServiceFactory } from '@backstage/backend-defaults/rootConfig';
  import { rootHealthServiceFactory } from '@backstage/backend-defaults/rootHealth';
  import { rootHttpRouterServiceFactory } from '@backstage/backend-defaults/rootHttpRouter';
  import { rootLifecycleServiceFactory } from '@backstage/backend-defaults/rootLifecycle';
  import { rootLoggerServiceFactory } from '@backstage/backend-defaults/rootLogger';
  import { schedulerServiceFactory } from '@backstage/backend-defaults/scheduler';
  import { userInfoServiceFactory } from '@backstage/backend-defaults/userInfo';
  import { eventsServiceFactory } from '@backstage/plugin-events-node';

  import { createSpecializedBackend } from '@backstage/backend-app-api';
  // Import custom url reader
  import { urlReaderServiceFactory } from './service/urlReader';

  const defaultServiceFactories: Array<
    ServiceFactory<unknown, 'plugin' | 'root'>
  > = [
    authServiceFactory,
    cacheServiceFactory,
    databaseServiceFactory,
    discoveryServiceFactory,
    httpAuthServiceFactory,
    httpRouterServiceFactory,
    lifecycleServiceFactory,
    loggerServiceFactory,
    permissionsServiceFactory,
    schedulerServiceFactory,
    userInfoServiceFactory,
    eventsServiceFactory,
    rootConfigServiceFactory,
    rootHttpRouterServiceFactory,
    rootLifecycleServiceFactory,
    rootLoggerServiceFactory,
    rootHealthServiceFactory,
    // Custom url reader
    urlReaderServiceFactory,
  ];

  const backend = createSpecializedBackend({ defaultServiceFactories });

  // Add workstream automation plugin here
  backend.add(
    import('@appdev-platform/backstage-plugin-workstream-automation-backend'),
  );

  // Catalog plugin
  backend.add(import('@backstage/plugin-catalog-backend'));

  // Add workstream automation plugin module after catalog plugin
  backend.add(
    import(
      '@appdev-platform/backstage-plugin-workstream-automation-backend/module'
    ),
  );
  // all other plugins and modules
  //...
  backend.start();
  ```

### Run backend

To start backend, run the following command:

```sh
yarn start-backend
```

## Frontend Installation

### Obtain the plugin

Add the workstream automation plugin to your Backstage frontend app by running this command:

```sh
yarn workspace app add @appdev-platform/backstage-plugin-workstream-automation
yarn workspace app add @appdev-platform/backstage-plugin-workstream-automation-common
```

### Set up the frontend plugin

#### Icons and Relations

Add the required icons to backstage app context

```jsx title="packages/app/src/App.tsx"
import WebLinkIcon from '@material-ui/icons/Language';
import GroupWorkIcon from '@material-ui/icons/GroupWork';
import { EmailIcon } from '@backstage/core-components';
import {
  JiraIcon,
  SlackIcon,
} from '@appdev-platform/backstage-plugin-workstream-automation';

const app = createApp({
  // Add these icons
  icons: {
    'kind:workstream': GroupWorkIcon,
    mail: EmailIcon,
    slack_contact: SlackIcon,
    jira: JiraIcon,
    link: WebLinkIcon,
  },
});
```

<b>(Optional)\*</b> Add Workstream relations to catalog graph page which will show :

```jsx title="packages/app/src/App.tsx"
import {
  ALL_RELATION_PAIRS,
  CatalogGraphPage,
} from '@backstage/plugin-catalog-graph';
import { WORKSTREAM_RELATION_PAIR } from '@appdev-platform/backstage-plugin-workstream-automation-common';

const routes = (
  <FlatRoutes>
    {/* Update catalog graph route */}
    <Route
      path="/catalog-graph"
      element={
        <CatalogGraphPage
          relationPairs={[WORKSTREAM_RELATION_PAIR, ...ALL_RELATION_PAIRS]}
        />
      }
    />
  </FlatRoutes>
);
```

#### Workstream Entity Page

Add workstream entity page with workstream related cards and update `entityPage` with case to handle `kind:workstream`.

```jsx title="packages/app/src/components/catalog/EntityPage.tsx"
import {
  WorkstreamAboutCard,
  WorkstreamDeleteModal,
  WorkstreamLinksCard,
  WorkstreamMembersCard,
  WorkstreamPortfolioCard,
} from '@appdev-platform/backstage-plugin-workstream-automation';

import {
  WORKSTREAM_RELATION_PAIR,
  workstreamDeletePermission,
} from '@appdev-platform/backstage-plugin-workstream-automation-common';

const WorkstreamEntityPage = () => {
  const { allowed } = usePermission({
    permission: workstreamDeletePermission,
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  return (
    <>
      {deleteModalOpen && (
        <WorkstreamDeleteModal
          open={deleteModalOpen}
          deleteModalCloseFn={setDeleteModalOpen}
        />
      )}
      <EntityLayout
        UNSTABLE_contextMenuOptions={{ disableUnregister: true }}
        {...(allowed && {
          UNSTABLE_extraContextMenuItems: [
            {
              title: 'Delete',
              Icon: Delete,
              onClick: () => setDeleteModalOpen(true),
            },
          ],
        })}
        parentEntityRelations={[]}
      >
        <EntityLayout.Route path="/overview" title="Overview">
          <Container>
            <Grid container spacing={3} alignItems="stretch">
              {entityWarningContent}
              <Grid item xs={8}>
                <WorkstreamAboutCard variant="gridItem" />
              </Grid>
              <Grid item xs={4}>
                <WorkstreamLinksCard variant="gridItem" />
              </Grid>
              <Grid item xs={8}>
                <WorkstreamMembersCard variant="gridItem" />
              </Grid>
              <Grid item xs={4}>
                <WorkstreamPortfolioCard variant="gridItem" />
              </Grid>
              <Grid item xs={12}>
                <EntityCatalogGraphCard
                  height={400}
                  showArrowHeads
                  relationPairs={[['leadOf', 'leadBy']]}
                />
              </Grid>
            </Grid>
          </Container>
        </EntityLayout.Route>
        <EntityLayout.Route title="Diagram" path="diagram">
          <EntityCatalogGraphCard
            variant="gridItem"
            mergeRelations
            relationPairs={[WORKSTREAM_RELATION_PAIR]}
            direction={Direction.LEFT_RIGHT}
            title="Workstream Diagram"
            relations={[
              ...WORKSTREAM_RELATION_PAIR,
              RELATION_HAS_PART,
              'technical-lead',
              'software-engineer',
              'quality-engineer',
            ]}
            unidirectional
            showArrowHeads
            height={600}
          />
        </EntityLayout.Route>
      </EntityLayout>
    </>
  );
};

export const entityPage = (
  <EntitySwitch>
    <EntitySwitch.Case if={isKind('workstream')}>
      <WorkstreamEntityPage />
    </EntitySwitch.Case>
  </EntitySwitch>
);
```

Add workstreams card on users page

```jsx title="packages/app/src/components/catalog/EntityPage.tsx"
import { UserWorkstreamCard } from '@appdev-platform/backstage-plugin-workstream-automation';

const userPage = (
  <EntityLayoutWrapper>
    <EntityLayout.Route path="/" title="Overview">
      <Grid container spacing={3}>
        {/** ... */}
        {/** Add users card below this */}
        <Grid item md={6} xs={12}>
          <UserWorkstreamCard variant="gridItem" />
        </Grid>
      </Grid>
    </EntityLayout.Route>
  </EntityLayoutWrapper>
);
```

#### Custom Columns

To add custom columns add the following in your `App.tsx` you need to first go through [Catalog Customisaion](https://backstage.io/docs/features/software-catalog/catalog-customization) doc here and create custom catalog page. Then add edit the cusotm columns as shown below.

```jsx title="packages/app/src/App.tsx"
import {
  CatalogTable,
  CatalogTableColumnsFunc,
} from '@backstage/plugin-catalog';
import { workstreamColumns } from '@appdev-platform/backstage-plugin-workstream-automation';

const myColumnsFunc: CatalogTableColumnsFunc = entityListContext => {
  if (entityListContext.filters.kind?.value === 'Workstream') {
    return workstreamColumns;
  }
  return CatalogTable.defaultColumnsFunc(entityListContext);
};

const routes = (
  // Add here
  <Route
    path="/catalog"
    element={<CatalogIndexPage columns={myColumnsFunc} />}
  />
);
```

#### Addign Catalog Filters

The workstream plugin has multiple filters for catalog:

- **UserWorkstreamPicker**: Select workstream and view all users it is part of
- **WorkstreamLeadPicker**: Filter wokrstreams based on workstream lead
- **WorkstreamPillarPicker**: Filter wokrstreams based on pillar
- **WorkstreamPortfolioPicker**: Filter wokrstreams based on the portfolios that are part of workstreams

This is how you can add them, The below code also shows how to add <em>Create</em> button to create new workstreams

```jsx title="packages/app/src/components/CatalogPage/CatalogPage.tsx"
import {
  CreateWorkstreamModal,
  UserWorkstreamPicker,
  WorkstreamLeadPicker,
  WorkstreamPillarPicker,
  WorkstreamPortfolioPicker,
} from '@appdev-platform/backstage-plugin-workstream-automation';
import { workstreamCreatePermission } from '@appdev-platform/backstage-plugin-workstream-automation-common';

const HeaderButtons = () => {
  const createComponentLink = useRouteRef(
    catalogPlugin.externalRoutes.createComponent,
  );

  const { allowed: isAllowed } = usePermission({
    permission: workstreamCreatePermission,
  });

  const {
    filters: { kind },
  } = useEntityList();

  return (
    <div style={{ display: 'flex' }}>
      {kind?.value === 'workstream' ? (
        isAllowed && <CreateWorkstreamModal />
      ) : (
        <>
          <CreateButton
            title="Create"
            to={createComponentLink && createComponentLink()}
          />
          <SupportButton>All your software catalog entities</SupportButton>
        </>
      )}
    </div>
  );
};

export const CatalogPage = () => {
  // ...
  // ...
  return (
    <PageWithHeader title={`${orgName} Catalog`} themeId="app">
      <Content>
        <EntityListProvider pagination>
          <Box
            display="flex"
            justifyContent="space-between"
            marginBottom="24px"
          >
            {/* Add Header buttons with has create button */}
            <HeaderButtons />
          </Box>
          <CatalogFilterLayout>
            <CatalogFilterLayout.Filters>
              <EntityKindPicker initialFilter="system" hidden />
              <EntityTypePicker />
              {/* Add filters here */}
              <WorkstreamLeadPicker />
              <WorkstreamPillarPicker />
              <WorkstreamPortfolioPicker />
              <UserWorkstreamPicker />
            </CatalogFilterLayout.Filters>
            <CatalogFilterLayout.Content>
              <CatalogTable columns={createTableColumnsFunc} />
            </CatalogFilterLayout.Content>
          </CatalogFilterLayout>
        </EntityListProvider>
      </Content>
    </PageWithHeader>
  );
};
```

<center>
  If you have any questions or queries, contact us on slack: [#forum-one-platform](https://redhat.enterprise.slack.com/archives/C04FC8AUM3M)
</center>
