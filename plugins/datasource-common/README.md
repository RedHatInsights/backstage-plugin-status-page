# Datasource Common

A common library package for the datasource plugin, providing shared types, validators, API clients, and utilities for both frontend and backend components.

## Overview

This package contains shared functionality used by both `@compass/backstage-plugin-datasource` (frontend) and `@compass/backstage-plugin-datasource-backend` (backend) packages. It provides a single source of truth for data models, validation schemas, and API client implementations.

## Features

- **TypeScript Types**: Strongly-typed interfaces for datasource entities and API models
- **Zod Validators**: Runtime validation schemas for datasource data
- **API Client**: Auto-generated TypeScript client for the datasource API
- **Reference Utilities**: Helper functions for parsing and stringifying datasource references
- **OpenAPI Models**: Auto-generated types from OpenAPI specification
- **Catalog Integration Types**: Backstage catalog-compatible entity definitions

## Installation

```bash
# From your Backstage root directory
yarn add @compass/backstage-plugin-datasource-common
```

This package is typically installed automatically as a dependency of the frontend or backend datasource plugins.

## Exports

### Types

#### `DatasourceEntity`

A Backstage catalog entity type for datasources, extending the standard `Resource` entity with datasource-specific fields:

```typescript
import { DatasourceEntity } from '@compass/backstage-plugin-datasource-common';

const datasource: DatasourceEntity = {
  apiVersion: 'resource/v1alpha1',
  kind: 'Resource',
  metadata: {
    name: 'user-analytics-db',
    namespace: 'default',
    annotations: {
      'compass.redhat.com/ai-related': 'true',
    },
    datasourceId: 'abc-123-def-456',
  },
  spec: {
    type: 'database',
    owner: 'user:default/data-team',
    steward: 'user:default/john-doe',
    usage: 'Analytics and reporting',
    location: 'us-east-1',
    classification: 'RH-Restricted',
    existsIn: [
      {
        name: 'Data Warehouse',
        description: 'Primary storage location',
      },
    ],
  },
};
```

#### `Datasource`

The complete datasource model including all metadata fields:

```typescript
import { Datasource } from '@compass/backstage-plugin-datasource-common';

// Includes: name, title, namespace, description, aiRelated, owner, steward,
// type, usage, location, classification, existsIn, system, dependencyOf,
// dependsOn, id, createdAt, createdBy, updatedAt, updatedBy
```

#### `CreateDatasource`

The datasource creation model (excludes auto-generated fields):

```typescript
import { CreateDatasource } from '@compass/backstage-plugin-datasource-common';

// Includes all fields except: id, createdAt, createdBy, updatedAt, updatedBy
```

#### `RhDataClassifications`

Data classification enumeration:

```typescript
type RhDataClassifications =
  | 'RH-Public'
  | 'RH-Internal'
  | 'RH-Restricted'
  | 'RH-Restricted(+PII)';
```

#### `DatasourceAiRelatedEnum`

AI-related status enumeration:

```typescript
type DatasourceAiRelatedEnum = 'true' | 'false';
```

### Validators

#### `createDatasourceParser`

A Zod schema for validating datasource creation payloads:

```typescript
import { createDatasourceParser } from '@compass/backstage-plugin-datasource-common';

try {
  const validatedData = createDatasourceParser.parse(userInput);
  // Data is valid and type-safe
} catch (error) {
  // Validation failed
  console.error(error);
}
```

#### `ExistsInSchema`

Validates the data store existence specification:

```typescript
import { ExistsInSchema } from '@compass/backstage-plugin-datasource-common';

const existsIn = ExistsInSchema.parse({
  name: 'Data Warehouse',
  description: 'Primary storage',
});
```

#### `DataStoreNameSchema`

Validates supported data store names:

```typescript
import { DataStoreNameSchema } from '@compass/backstage-plugin-datasource-common';

// Valid values: 'GraphQL', 'XE S3 Bucket', 'Starburst', 'Dataverse', 'Data Warehouse'
const storeName = DataStoreNameSchema.parse('Data Warehouse');
```

### API Client

#### `DatasourceApiClient`

A fully-typed HTTP client for interacting with the datasource backend API:

```typescript
import { DatasourceApiClient } from '@compass/backstage-plugin-datasource-common';
import { discoveryApiRef, fetchApiRef } from '@backstage/core-plugin-api';

// In a Backstage frontend component
const discoveryApi = useApi(discoveryApiRef);
const fetchApi = useApi(fetchApiRef);

const apiClient = new DatasourceApiClient({
  discoveryApi,
  fetchApi,
});

// List all datasources
const datasources = await apiClient.listDatasources({});

// Get a specific datasource
const datasource = await apiClient.getDatasource({
  path: { namespace: 'default', name: 'my-datasource' },
});

// Create a new datasource
const newDatasource = await apiClient.addDatasource({
  body: {
    name: 'my-datasource',
    title: 'My Datasource',
    namespace: 'default',
    // ... other required fields
  },
});

// Delete a datasource
await apiClient.deleteDatasource({
  path: { namespace: 'default', name: 'my-datasource' },
});
```

### Utility Functions

#### `stringifyDatasourceRef`

Converts a datasource reference object to a string format:

```typescript
import { stringifyDatasourceRef } from '@compass/backstage-plugin-datasource-common';

const refString = stringifyDatasourceRef({
  namespace: 'default',
  name: 'user-analytics-db',
});
// Returns: "default/user-analytics-db"
```

#### `parseDatasourceRef`

Parses a datasource reference string into an object:

```typescript
import { parseDatasourceRef } from '@compass/backstage-plugin-datasource-common';

const ref = parseDatasourceRef('default/user-analytics-db');
// Returns: { namespace: 'default', name: 'user-analytics-db' }
```

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

### Type Checking

This package is fully typed and exports all types for consumption by other packages. No additional type installation is required.

## OpenAPI Code Generation

The API client and models are auto-generated from the OpenAPI specification defined in the backend plugin. Types are generated in `src/schema/openapi/generated/`.

If the OpenAPI spec changes, regenerate types from the backend plugin:

```bash
# From the backend plugin directory
cd ../datasource-backend
yarn generate
```

This will update both the backend and common package generated types.

## Package Structure

```
src/
├── index.ts                          # Main entry point
├── types.ts                          # Custom TypeScript types
├── parser.ts                         # Zod validation schemas
└── schema/
    └── openapi/
        ├── index.ts                  # OpenAPI exports
        └── generated/                # Auto-generated code
            ├── apis/
            │   └── Api.client.ts     # API client
            └── models/               # TypeScript models
```

## Related Packages

This package is part of the datasource plugin ecosystem:

- **@compass/backstage-plugin-datasource**: Frontend plugin for Backstage UI
- **@compass/backstage-plugin-datasource-backend**: Backend plugin providing the REST API
- **@compass/backstage-plugin-datasource-common**: This package (shared utilities)
