# ServiceNow CMDB

Welcome to the ServiceNow CMDB plugin!

This plugin exposes a card component with CMDB Details of a Business Application. It relies on ServiceNow for the Application Details.

![CMDB Plugin Card Component](docs/CMDB%20Plugin%20Card.png)

This plugin is designed to work with all Entity kinds which contain the annotation: `servicenow.com/appcode`.

> **Note:** This plugin has been developed and tested with the [Tokyo release of the ServiceNow Platform](https://www.servicenow.com/company/media/press-room/now-platform-tokyo-release-business-transformation.html).
> You can find more information aboubt the Tokyo release on the [ServiceNow Product Documentation](https://docs.servicenow.com/bundle/tokyo-release-notes/page/release-notes/family-release-notes.html)

## Getting started

To get started, you need a running ServiceNow instance with [CMDB (Configuration Management Database)](https://www.servicenow.com/products/servicenow-platform/configuration-management-database.html).

1. Add this plugin to Backstage, first install the plugin:

```bash
# From your Backstage root directory
yarn add --cwd packages/app @appdev-platform/backstage-plugin-cmdb
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
```

3. Also add the 

3. Add the `ServiceDetailsCard` to the overview tab of the Catalog Entity Page.

```tsx
// In packages/app/src/components/catalog/EntityPage.tsx
import {
  ServiceDetailsCard,
  isAppCodeAvailable,
} from '@appdev-platform/backstage-plugin-cmdb';

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
