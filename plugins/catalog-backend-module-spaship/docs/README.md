# Catalog Backend module to import SPAship Properties and Applications

This is an extension module to the catalog-backend plugin, providing a SPAshipDiscoveryEntityProvider that can be used to ingest SPAship Properties and Applications.

## Prerequisites

- A SPAship instance with an API Access Token

## Installation

The provider is not installed by default, therefore you need to add a dependency to `@compass/backstage-plugin-catalog-backend-module-spaship` to your backend pacakge
```
# From you backstage root directory
yarn workspace backend add @compass/backstage-plugin-catalog-backend-module-spaship
```

Update the catalog plugin initialization in your backend to add the provider and schedule it:
```diff title="packages/backend/src/plugins/catalog.ts
// In file: packages/backend/src/plugins/catalog.ts
export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  const builder = await CatalogBuilder.create(env);
  builder.addProcessor(new ScaffolderEntitiesProcessor());

+  const spashipProvider = SPAshipDiscoveryEntityProvider.fromConfig(env.config, {
+    logger: env.logger,
+    scheduler: env.scheduler,
+  });
+
+  builder.addEntityProvider(...spashipProvider);

  // ...
}
```

## Configuration

The following configuration is an example of how to setup a SPAship Provider with SPAship Integration:

```yaml title="app-config.yaml
integrations:
  spaship:
    - host: ${SPASHIP_HOST}
      apiBaseUrl: ${SPASHIP_API_URL}
      apiKey: ${SPASHIP_API_TOKEN}

catalog:
  providers:
    spaship:
      myproject:
        host: ${SPASHIP_HOST}
        defaultOwnerNamespace: 'redhat'
        customMappings:
          'metadata.annotations["jira/project-key"]': '{{ u_jira_key }}'
        overrides:
          metadata:
            namespace: 'dx'
        schedule:
          frequency:
            minutes: 2
          timeout:
            minutes: 5
```

There may be many providers, each with a unique `providerId` for example `myproject` in the above snippet.

## Reference

#### host

_required_\
This is used to identify the spaship integration defined in the `integrations` in the app-config.yaml.

#### defaultOwnerNamespace

A default namespace for the owners of the generated entities.
Defaults to the DEFAULT_NAMESPACE of the backstage instance.

You can add a custom/derived namespace by using the customMappings instead.

#### properties

A list of property names to import from SPAship. If not defined, all the properties are imported.

#### excludeProperties

A list of SPAship properties to exlude from being ingested into backstage catalog.

#### overrides

The overrides object can be used for adding some additional static fields in the composed entity before it gets applied and processed in the catalog.

#### customPropertyMappings

A key-value map used for adding custom fields to the composed system entities. The keys here are the fields in the system entity. You can use nunjucks templates for composing the values in the key-value pairs. The nunjucks templates are populated with the spaship property object from SPAship.

#### customApplicationMappings

A key-value map used for adding custom fields to the composed component entities. The keys here are the fields in the component entity. You can use nunjucks templates for composing the values in the key-value pairs. The nunjucks templates are populated with the spaship application object from SPAship.

#### schedule

_required_\
A task schedule for the job to import the spaship properties at a regular interval. Can also be defined at the plugin initialization step in `catalog.ts` file.
