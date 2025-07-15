# Catalog Backend module for Enrichment Data

This is an extension module for the plugin-catalog-backend plugin, providing an EnrichmentDataProcessor that allows users to manage large number of entities by using enrichment data sets that extend an existing entity in the catalog.

## Installation

The processor is not available in Backstage out of box, so you need to install it as a dependency for the backend package.

```bash
# From your backstage root directory
yarn workspace backend add @compass/backstage-plugin-catalog-backend-enrichment
```

### Adding the module to the backend

```ts
// packages/backend/src/index.ts

const backend = createBackend();

// ...
backend.add(import('@compass/backstage-plugin-catalog-backend-module-enrichment'));
```

#### Note:

To enable catalog import for EnrichmentData entity types, you need to add `EnrichmentData` to `catalog.rules.$.allow` in the `app-config.yaml`

```yaml
// app-config.yaml

catalog:
  rules:
    - allow:
      - // ... other entity types
      - EnrichmentData
```

## Examples for enrichment data

The enrichment data entity kind is an additional entity type which allows you to add any additional data to an existing entity without modifying the original entity yaml.

The enrichment data entity looks like this:

```yaml
// enrichment-data.yaml

apiVersion: console.one.redhat.com/v1alpha1
kind: EnrichmentData
metadata:
  name: enrichment-data-for-example-website-1
  description: Enrichment data that extends an existing component
spec:
  owner: user:default/guest
  selectors:
    - entityRef: component:default/example-website-for-enrichment-data
  template:
    metadata:
      tags:
        - enriched
    spec:
      foo: bar
```

Here, the `spec.selectors` is an array of entities which should inherit the properties from this enrichment data.

And the `spec.template` contains the fields which will be copied to the selected entities.
