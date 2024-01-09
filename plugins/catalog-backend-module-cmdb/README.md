# Catalog Backend module to import CMDB Business Applications

This is an extension module to the plugin-catalog-backend plugin, providing a CMDBDiscoveryEntityProvider and CMDBDiscoveryEntityProcessor that can be used to ingest business applications from Service Now Configuration Management Database (CMDB). This processor is useful if you want to import business applications as a custom `BusinessApplication` kind.

## Prerequisites

- A ServiceNow instance with a service account / username+password
- CMDB table with the table name `cmdb_ci_business_app`

## Installation

The provider is not installed by default, therefore you need to add a dependency to `@appdev-platform/backstage-plugin-catalog-backend-module-cmdb` to your backend package
```
# From your backstage root directory
yarn workspace backend add @appdev-platform/backstage-plugin-catalog-backend-module-cmdb
```

Update the catalog plugin initialization in your backend to add the provider and schedule it:
```diff title="packages/backend/src/plugins/catalog.ts"
// packages/backend/src/plugins/catalog.ts
export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  const builder = await CatalogBuilder.create(env);
  builder.addProcessor(new ScaffolderEntitiesProcessor());

+  const cmdbProvider = CMDBDiscoveryEntityProvider.fromConfig(env.config, {
+    logger: env.logger,
+    scheduler: env.scheduler,
+  });
+
+  const cmdbProcessor = new BusinessApplicationEntityProcessor();
+
+  builder.addEntityProvider(...cmdbProvider);
+  builder.addProcessor(cmdbProcessor);

  // ...
}
```

### Configuration

The following configuration is an example of how to setup a cmdb provider with the servicenow integration

```yaml title="app-config.yaml
integrations:
  servicenow:
    - host: ${SNOW_HOST}
      apiBaseUrl: ${SNOW_API_BASE_URL}
      credentials:
        username: ${SNOW_USERNAME}
        password: ${SNOW_PASSWORD}

catalog:
  providers:
    cmdb:
      myproject:
        host: ${SNOW_HOST}
        querySize: 1
        sysparmQuery: 'owned_by.email=jdoe@example.com'
        customMappings:
          'metadata.annotations["jira/project-key"]': '{{ u_jira_key }}'
        additionalQueryFields:
          - 'u_jira_key'
        overrides:
          spec:
            system: default/my-system
        schedule:
          frequency:
            minutes: 2
          timeout:
            minutes: 5
```

There may be many providers, each with a unique `providerId` for example `myproject` in the above snippet.

#### Reference

##### host

_required_\
This is used to identify the service now integration defined in the `integrations` in the app-config.yaml.

##### sysparmQuery

_required_\
A query that gets executed on the cmdb table in service now to get business applications. This query should return 1 or more business applications in the response, which are then transformed into kind: BusinessApplication entitites in the backstage catalog.

##### querySize

The max size for the cmdb query response. Can be used for reducing the response size, and performance. (default: 100)

##### overrides

The overrides object can be used for adding some additional static fields in the composed entity before it gets applied and processed in the catalog.

##### customMappings

A key-value map used for adding custom fields to the composed business application entity. The keys here are the fields in the business application entity. You can use nunjucks templates for composing the values in the key-value pairs. The nunjucks templates are populated with the cmdb business application object from the CMDB response.

##### additionalQueryFields

Additional fields that will be queried from the service now api. Can be used along with customMappings to process any custom/non-standard fields from the cmdb table.

##### schedule

A task schedule for the job to import the cmdb applications at a regular interval. Can also be defined at the plugin initialization step in `catalog.ts` file.
