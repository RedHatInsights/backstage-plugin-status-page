# Catalog Backend Module - Datasource

A Backstage catalog backend module that extends the catalog with datasource entity processing capabilities. This module enables the Backstage catalog to recognize, validate, and process datasource entities, automatically creating relationships and integrating them into the catalog graph.

## Overview

This module integrates datasources into the Backstage catalog system by:

- Registering `datasource` as a valid location type in the catalog
- Providing entity processing for datasource Resources
- Validating datasource entities against a JSON schema
- Fetching datasource data from the datasource backend API
- Automatically creating entity relationships (dependencies, ownership, systems, stewards)
- Mapping datasource data to Backstage Resource entities

## Features

- **Custom Location Type**: Adds support for `datasource` location type in the catalog
- **Entity Validation**: JSON schema-based validation for datasource Resource entities
- **API Integration**: Fetches datasource data from the datasource backend API
- **Relationship Management**: Automatically creates catalog relationships:
  - Owner relationships
  - Data steward relationships
  - System membership (partOf/hasPart)
  - Dependencies (dependsOn/dependencyOf)
- **AI Classification**: Identifies and processes AI-related datasources via annotations

## Installation

Install the module to your backend package:

```bash
# From your Backstage root directory
yarn --cwd packages/backend add @compass/backstage-plugin-catalog-backend-module-datasource
```

Then add the module to your backend in `packages/backend/src/index.ts`:

```ts
const backend = createBackend();

// Add the catalog plugin
backend.add(import('@backstage/plugin-catalog-backend'));

// Add the datasource catalog module
backend.add(import('@compass/backstage-plugin-catalog-backend-module-datasource'));

// ... other plugins
```

## How It Works

### Location Processing

When a datasource is created via the datasource backend API, a catalog location with type `datasource` is registered. This module intercepts that location and:

1. Parses the datasource reference (format: `namespace/name`)
2. Fetches the datasource data from the datasource backend API
3. Transforms it into a Backstage Resource entity
4. Emits the entity to the catalog for processing

### Entity Validation

The module validates datasource Resource entities using a JSON schema. An entity is recognized as a datasource if it meets these criteria:

- `kind`: `Resource`
- `apiVersion`: `resource/v1alpha1`
- Has annotation: `compass.redhat.com/ai-related: "true"`

### Entity Structure

Datasource entities follow this structure:

```yaml
apiVersion: resource/v1alpha1
kind: Resource
metadata:
  name: customer-orders-dataset
  title: Customer Orders Dataset
  namespace: default
  description: Contains customer purchase orders (~1.2M records)
  annotations:
    compass.redhat.com/ai-related: "true"
  datasourceId: abc-123-def-456
spec:
  type: s3-bucket
  owner: group:data-platform
  steward: user:default/john-doe
  system: sales-analytics
  usage: Used to train ML models and generate dashboards
  location: s3://internal-data/sales/orders
  classification: RH-Restricted(+PII)
  existsIn:
    - name: GraphQL
      description: Exposed via Falcon GraphQL API
    - name: Data Warehouse
      description: Transformed copy in Snowflake
  dependencyOf:
    - component:default/analytics-dashboard
  dependsOn:
    - datasource:default/raw-events
```

### Relationship Creation

The `DatasourceEntityProcessor` automatically creates bidirectional relationships:

#### Owner Relationship
- Links the datasource to its owner entity (User or Group)
- Standard Backstage ownership relationship

#### Steward Relationship
- Creates a `data-steward` relationship between the datasource and the steward entity
- Defaults to User kind in the `redhat` namespace

#### System Relationship
- Links datasource to its parent system using `partOf`/`hasPart` relations
- Enables system-level grouping of datasources

#### Dependency Relationships
- `dependsOn`: Links to datasources/components this datasource depends on
- `dependencyOf`: Links to components/services that depend on this datasource
- Creates bidirectional relations for dependency tracking

## Data Classification

The module supports Red Hat data classifications:

- `RH-Public` - Publicly available data
- `RH-Internal` - Internal use only
- `RH-Restricted` - Restricted access required
- `RH-Restricted(+PII)` - Restricted with personally identifiable information

Reference: [Red Hat Data Classifications](https://source.redhat.com/departments/it/it_information_security/wiki/red_hat_data_classifications)

## Supported Data Stores

Datasources can exist in multiple data stores simultaneously:

- **GraphQL** - Exposed via GraphQL APIs
- **XE S3 Bucket** - AWS S3 storage
- **Starburst** - Starburst data lakehouse
- **Dataverse** - Microsoft Dataverse
- **Data Warehouse** - Enterprise data warehouses (e.g., Snowflake)

## Architecture

### Components

#### `catalogModuleDatasource`

The main module that registers with the Backstage backend:

- Initializes the DatasourceEntityProcessor
- Configures the datasource API client
- Registers the `datasource` location type
- Adds the processor to the catalog pipeline

#### `DatasourceEntityProcessor`

Implements `CatalogProcessor` interface:

- **`validateEntityKind(entity)`**: Validates datasource entities against JSON schema
- **`readLocation(location)`**: Fetches datasource data from the backend API
- **`postProcessEntity(entity, location, emit)`**: Creates entity relationships
- **`getProcessorName()`**: Returns "DatasourceEntityProcessor"
- **`getPriority()`**: Returns 1 (standard priority)

#### Utility Functions

**`isAiDatasourceEntity(entity)`**

Checks if an entity is a datasource Resource:

```typescript
import { isAiDatasourceEntity } from './lib/utils';

if (isAiDatasourceEntity(entity)) {
  // Process as datasource
}
```

**`mapDatasourceToResourceEntity(datasource)`**

Transforms datasource API data to a Backstage Resource entity:

```typescript
import { mapDatasourceToResourceEntity } from './lib/utils';

const resourceEntity = mapDatasourceToResourceEntity(datasourceData);
```

## Example Usage

### Creating a Datasource in the Catalog

When you create a datasource via the backend API:

```bash
curl -X POST http://localhost:7007/api/datasource/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "user-analytics-db",
    "title": "User Analytics Database",
    "namespace": "default",
    ...
  }'
```

The catalog module will:

1. Receive the `datasource:default/user-analytics-db` location
2. Fetch the full datasource data from the API
3. Transform it into a Resource entity
4. Create relationships to the owner, steward, and system
5. Add the entity to the catalog

### Viewing Datasources in the Catalog

Datasources appear as Resource entities in the Backstage catalog UI and can be:

- Searched and filtered
- Viewed with all metadata and relationships
- Linked to/from other entities (components, systems, etc.)
- Discovered through ownership and system membership

## Development

### Building

```bash
yarn build
```

### Testing

```bash
yarn test
```

### Linting

```bash
yarn lint
```

## JSON Schema

The module uses a JSON schema (`src/schema/resource.v1.schema.json`) to validate datasource entities. The schema defines:

- Required fields and structure
- Data classification enumerations
- Data store options
- Relationship formats
- Field descriptions and examples

## Integration Points

### Requires

- `@backstage/plugin-catalog-backend` - The core catalog plugin
- `@compass/backstage-plugin-datasource-backend` - Backend API for datasource data

### Extends

- Catalog processing pipeline via `catalogProcessingExtensionPoint`
- Catalog location types via `catalogLocationsExtensionPoint`

### Uses

- `DatasourceApiClient` from `@compass/backstage-plugin-datasource-common`
- Backstage core services: discovery, auth, logger

## Related Packages

This module is part of the datasource plugin ecosystem:

- **@compass/backstage-plugin-datasource**: Frontend plugin for Backstage UI
- **@compass/backstage-plugin-datasource-backend**: Backend plugin providing the REST API
- **@compass/backstage-plugin-datasource-common**: Shared utilities and types
- **@compass/backstage-plugin-catalog-backend-module-datasource**: This package (catalog integration)

## Troubleshooting

### Datasources not appearing in catalog

1. Verify the datasource backend plugin is installed and running
2. Check that the catalog module is properly registered
3. Ensure datasources have the `compass.redhat.com/ai-related: "true"` annotation
4. Check backend logs for entity processing errors

### Validation errors

1. Verify the datasource entity matches the JSON schema
2. Ensure all required fields are present
3. Check that classification and data store values are valid enums

### Relationship issues

1. Verify referenced entities (owners, systems, etc.) exist in the catalog
2. Check entity references use correct format: `kind:namespace/name`
3. Ensure default namespaces are configured correctly

