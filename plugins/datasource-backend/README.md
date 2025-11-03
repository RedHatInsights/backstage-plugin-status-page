# Datasource Backend Plugin

A Backstage backend plugin for managing data sources with classification, metadata, and dependency tracking. This plugin provides a RESTful API for creating, reading, updating, and deleting datasource entities, integrating seamlessly with the Backstage catalog system.

## Features

- **CRUD Operations**: Full create, read, update, and delete operations for datasources
- **Data Classification**: Support for Red Hat data classifications (Public, Internal, Restricted, Restricted+PII)
- **Dependency Tracking**: Track dependencies between datasources and other entities
- **Catalog Integration**: Automatically registers datasources as catalog locations
- **Multi-store Support**: Track datasource presence across multiple data stores (GraphQL, S3, Starburst, Dataverse, Data Warehouse)
- **Audit Trail**: Automatic tracking of creation and modification metadata (created/updated by/at)
- **OpenAPI Specification**: Fully documented API with auto-generated types and validation
- **Database Migrations**: Automated schema management with Knex migrations

## Installation

Install the plugin to your backend package:

```bash
# From your Backstage root directory
yarn --cwd packages/backend add @compass/backstage-plugin-datasource-backend
```

Then add the plugin to your backend in `packages/backend/src/index.ts`:

```ts
const backend = createBackend();
// ... other plugins
backend.add(import('@compass/backstage-plugin-datasource-backend'));
```

## Configuration

The plugin requires database access and catalog service integration. These are automatically provided by Backstage's core services when the plugin is registered.

### Database

The plugin uses Knex for database operations and supports the same databases as Backstage (PostgreSQL, SQLite, etc.). Database migrations are automatically applied on startup unless disabled.

To skip migrations (if managing schema separately):

```yaml
# app-config.yaml
backend:
  database:
    plugin:
      datasource:
        migrations:
          skip: true
```

## API Reference

The plugin exposes a RESTful API at `/api/datasource` with the following endpoints:

### GET `/`
List all datasources.

**Response**: Array of datasource objects

### POST `/`
Create a new datasource.

**Request Body**:
```json
{
  "name": "user-analytics-db",
  "title": "User Analytics Database",
  "namespace": "default",
  "description": "Database containing user behavior analytics",
  "aiRelated": "true",
  "owner": "user:default/data-team",
  "steward": "user:default/john-doe",
  "type": "database",
  "usage": "Analytics and reporting",
  "location": "us-east-1",
  "classification": "RH-Restricted",
  "existsIn": [
    {
      "name": "Data Warehouse",
      "description": "Primary storage location"
    }
  ],
  "system": "analytics-platform",
  "dependencyOf": ["component:default/analytics-dashboard"],
  "dependsOn": ["datasource:default/raw-events-db"]
}
```

**Response**: Created datasource object with generated ID and metadata

### GET `/:namespace/:name`
Get a specific datasource by namespace and name.

**Parameters**:
- `namespace` - The datasource namespace
- `name` - The datasource name

**Response**: Datasource object or 404 if not found

### PUT `/:namespace/:name`
Update an existing datasource (currently not fully implemented).

### DELETE `/:namespace/:name`
Delete a datasource and remove it from the catalog.

**Parameters**:
- `namespace` - The datasource namespace
- `name` - The datasource name

**Response**: 410 (Gone) on success, 404 if not found

## Data Model

### Datasource Schema

| Field            | Type   | Required | Description                                          |
| ---------------- | ------ | -------- | ---------------------------------------------------- |
| `name`           | string | Yes      | Unique identifier for the datasource                 |
| `title`          | string | Yes      | Human-readable title                                 |
| `namespace`      | string | Yes      | Namespace for organization                           |
| `description`    | string | No       | Detailed description                                 |
| `aiRelated`      | enum   | Yes      | Whether datasource is AI-related ('true' or 'false') |
| `owner`          | string | Yes      | Entity reference of the owner                        |
| `steward`        | string | Yes      | Entity reference of the data steward                 |
| `type`           | string | Yes      | Type of datasource (e.g., 'database', 'api')         |
| `usage`          | string | Yes      | Description of datasource usage                      |
| `location`       | string | Yes      | Physical or cloud location                           |
| `classification` | enum   | Yes      | Data classification level                            |
| `existsIn`       | array  | Yes      | List of data stores where datasource exists          |
| `system`         | string | No       | Associated system reference                          |
| `dependencyOf`   | array  | Yes      | Entities that depend on this datasource              |
| `dependsOn`      | array  | Yes      | Datasources this entity depends on                   |
| `id`             | string | Auto     | UUID generated on creation                           |
| `createdAt`      | string | Auto     | ISO timestamp of creation                            |
| `createdBy`      | string | Auto     | Entity reference of creator                          |
| `updatedAt`      | string | Auto     | ISO timestamp of last update                         |
| `updatedBy`      | string | Auto     | Entity reference of last updater                     |

### Data Classifications

- `RH-Public` - Publicly available data
- `RH-Internal` - Internal use only
- `RH-Restricted` - Restricted access required
- `RH-Restricted(+PII)` - Restricted with personally identifiable information

### Supported Data Stores

- GraphQL
- XE S3 Bucket
- Starburst
- Dataverse
- Data Warehouse

## Development

### Running the Plugin Standalone

You can start the plugin in standalone mode for development:

```bash
cd plugins/datasource-backend
yarn start
```

This starts a limited backend setup convenient for developing the plugin itself.

### Running the Full Application

To run the entire Backstage application including the frontend:

```bash
# From the root directory
yarn start
```

### Testing

Run tests for the plugin:

```bash
cd plugins/datasource-backend
yarn test
```

### Linting

```bash
yarn lint
```

### Building

```bash
yarn build
```

### Generating OpenAPI Types

The plugin uses OpenAPI specifications to generate TypeScript types and validators:

```bash
yarn generate
```

This reads from `src/schema/openapi.yaml` and generates types in `src/schema/openapi/generated/`.

## Database Migrations

Migrations are located in the `migrations/` directory and are automatically applied when the plugin starts. The initial migration creates the `datasource` table with all required columns.

To create a new migration:

```bash
# Ensure you have knex installed globally or use npx
npx knex migrate:make migration_name --knexfile knexfile.js
```

## Integration with Backstage Catalog

When a datasource is created, the plugin automatically:
1. Stores the datasource in the database
2. Registers it as a catalog location with type `datasource`
3. Uses the datasource reference format: `datasource:namespace/name`

When a datasource is deleted, the plugin:
1. Removes the datasource from the database
2. Removes the associated catalog location

This ensures datasources are discoverable through the Backstage catalog and can be referenced by other entities.

## Health Check

The plugin includes a health check endpoint for monitoring:

```
GET /api/datasource/health
```
