# ServiceNow CMDB

This plugin exposes a card component with CMDB Details of a Business Application. It relies on ServiceNow for the Application Details.

![CMDB Plugin Card Component](CMDB%20Plugin%20Card.png)

This plugin is designed to work with all Entity kinds which contain the annotation: `servicenow.com/appcode`.

> **Note:** This plugin has been developed and tested with the [Tokyo release of the ServiceNow Platform](https://www.servicenow.com/company/media/press-room/now-platform-tokyo-release-business-transformation.html).
> You can find more information about the Tokyo release on the [ServiceNow Product Documentation](https://docs.servicenow.com/bundle/tokyo-release-notes/page/release-notes/family-release-notes.html)

## Getting started

### Adding CMDB Details Card

To get started, you need a running ServiceNow instance with [CMDB (Configuration Management Database)](https://www.servicenow.com/products/servicenow-platform/configuration-management-database.html).

1. Add this plugin to Backstage, first install the plugin:

```bash
# From your Backstage root directory
yarn add --cwd packages/app @compass/backstage-plugin-cmdb
```

2. Update the `app-config.yaml` and add ServiceNow host under the `proxy` section, and a separate `cmdb` field:

```yaml
proxy:
  # ...
  '/cmdb':
    target: ${SERVICE_NOW_HOST}
    changeOrigin: true
    allowedMethods: ['GET']
    headers:
      Authorization: ${SERVICE_NOW_API_TOKEN}

cmdb:
  host: ${SERVICE_NOW_HOST}
  userNamespace: mynamespace        # This field is optional (the backstage DEFAULT_NAMESPACE is used if it's not specified)
```

3. Add the `ServiceDetailsCard` to the overview tab of the Catalog Entity Page.

```tsx
// In packages/app/src/components/catalog/EntityPage.tsx
import {
  ServiceDetailsCard,
  isAppCodeAvailable,
} from '@compass/backstage-plugin-cmdb';

const overviewContent = (
  <Grid container spacing={3} alignItems="stretch">
    {/* other content */}

    <EntitySwitch>
      <EntitySwitch.Case if={isAppCodeAvailable}>
        <Grid item md={4}>
          <ServiceDetailsCard variant="gridItem" />
        </Grid>
      </EntitySwitch.Case>
    </EntitySwitch>
```

4. Now, to link an entity to it's CMDB Business Application, the entity must be annotated as follows:

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  # ...
  annotations:
    servicenow.com/appcode: <CMDB_APP_CODE>  # eg. APP-001
```

### Adding Infrastructure Details Page

This component requires that your servicenow instance has a `cmdb_rel_ci` table with the necessary relationships mapped for each business application in CMDB.

To add the infra details page, add the following piece of code to the EntityPage.tsx

```tsx
// In packages/app/src/components/catalog/EntityPage.tsx
import {
  isAppCodeAvailable,
  InfraDetailsPage,
} from '@compass/backstage-plugin-cmdb';

const infraDetailsContent = (
  <EntitySwitch>
    <EntitySwitch.Case if={isAppCodeAvailable}>
      <InfraDetailsPage />
    </EntitySwitch.Case>
    <EntitySwitch.Case>
      <MissingAnnotationEmptyState annotation={['servicenow.com/app-code']} />
    </EntitySwitch.Case>
  </EntitySwitch>
);

// ...

const serviceEntityPage = (
  <EntityLayout>
    // ...

    <EntityLayout.Route path="/infra" title="Infra Details">
      {infraDetailsContent}
    </EntityLayout.Route>

    // ...
);
```

#### Screenshot

![infra-details](Infra%20Details%20Page.png)
