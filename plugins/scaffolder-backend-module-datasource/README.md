# Scaffolder Backend Module - Datasource

A Backstage scaffolder backend module that provides custom actions for creating and validating datasource entities within software templates. This module enables template authors to automate datasource registration as part of the scaffolding process.

## Overview

This module extends the Backstage Scaffolder with custom actions for datasource management:

- **`datasource:validate`**: Validates datasource uniqueness before creation
- **`datasource:create`**: Creates and registers a new datasource entity

These actions integrate with the datasource backend API and catalog service to ensure datasources are properly created, validated, and registered in the Backstage catalog.

## Features

- **Template Integration**: Use datasource actions in Backstage software templates
- **Validation**: Prevents duplicate datasources in both database and catalog
- **Automatic Registration**: Creates datasource and registers it in the catalog automatically
- **Dry Run Support**: Test templates without actually creating datasources
- **Type Safety**: Full Zod schema validation for input data
- **Error Handling**: Comprehensive error handling with detailed logging

## Installation

Install the module to your backend package:

```bash
# From your Backstage root directory
yarn --cwd packages/backend add @compass/backstage-plugin-scaffolder-backend-module-datasource
```

Then add the module to your backend in `packages/backend/src/index.ts`:

```ts
const backend = createBackend();

// Add the scaffolder plugin
backend.add(import('@backstage/plugin-scaffolder-backend'));

// Add the datasource scaffolder module
backend.add(import('@compass/backstage-plugin-scaffolder-backend-module-datasource'));

// ... other plugins
```

## Actions

### `datasource:validate`

Validates that a datasource with the given name and namespace does not already exist in either the database or the catalog.

#### Input

| Parameter   | Type   | Required | Description                                        |
| ----------- | ------ | -------- | -------------------------------------------------- |
| `name`      | string | Yes      | Slug for the datasource entity (unique identifier) |
| `title`     | string | Yes      | Human-readable name of the datasource              |
| `namespace` | string | Yes      | Namespace for the datasource                       |

#### Output

| Property  | Type    | Description                                 |
| --------- | ------- | ------------------------------------------- |
| `valid`   | boolean | True if datasource name is unique and valid |
| `message` | string  | Validation result message                   |

#### Behavior

1. Checks if a datasource with the same name and namespace exists in the database
2. Checks if a resource entity with the same reference exists in the catalog
3. Throws `ConflictError` if a duplicate is found
4. Returns success if the datasource name is available

#### Example

```yaml
steps:
  - id: validate
    name: Validate Datasource
    action: datasource:validate
    input:
      name: ${{ parameters.name }}
      title: ${{ parameters.title }}
      namespace: ${{ parameters.namespace }}
```

### `datasource:create`

Creates a new datasource in the database and automatically registers it in the Backstage catalog.

#### Input

Accepts all fields from the `CreateDatasource` schema:

| Parameter        | Type   | Required | Description                                                                      |
| ---------------- | ------ | -------- | -------------------------------------------------------------------------------- |
| `name`           | string | Yes      | Unique identifier for the datasource                                             |
| `title`          | string | Yes      | Human-readable title                                                             |
| `namespace`      | string | Yes      | Namespace for organization                                                       |
| `description`    | string | No       | Detailed description                                                             |
| `aiRelated`      | enum   | Yes      | Whether datasource is AI-related ('true' or 'false')                             |
| `owner`          | string | Yes      | Entity reference of the owner                                                    |
| `steward`        | string | Yes      | Entity reference of the data steward                                             |
| `type`           | string | Yes      | Type of datasource (e.g., 'database', 's3-bucket')                               |
| `usage`          | string | Yes      | Description of datasource usage                                                  |
| `location`       | string | Yes      | Physical or cloud location                                                       |
| `classification` | enum   | Yes      | Data classification (RH-Public, RH-Internal, RH-Restricted, RH-Restricted(+PII)) |
| `existsIn`       | array  | Yes      | List of data stores where datasource exists                                      |
| `system`         | string | No       | Associated system reference                                                      |
| `dependencyOf`   | array  | Yes      | Entities that depend on this datasource                                          |
| `dependsOn`      | array  | Yes      | Datasources this entity depends on                                               |

#### Output

| Property    | Type   | Description                                                  |
| ----------- | ------ | ------------------------------------------------------------ |
| `entityRef` | string | Catalog entity reference (format: `resource:namespace/name`) |
| `message`   | string | Success or error message                                     |

#### Behavior

1. Validates input using Zod schema
2. Calls the datasource backend API to create the datasource
3. Automatically registers the datasource as a catalog location
4. Returns the entity reference for use in subsequent steps

#### Dry Run Support

When running in dry run mode:
- No datasource is actually created
- Returns a mock entity reference
- Useful for template testing and validation

#### Example

```yaml
steps:
  - id: create
    name: Create & Register Datasource
    if: "${{ steps['validate'].output.valid }}"
    action: datasource:create
    input:
      name: ${{ parameters.name }}
      title: ${{ parameters.title }}
      namespace: ${{ parameters.namespace }}
      description: ${{ parameters.description }}
      aiRelated: ${{ "true" if parameters.aiRelated else "false" }}
      owner: ${{ parameters.owner }}
      steward: ${{ parameters.steward }}
      type: ${{ parameters.type }}
      usage: ${{ parameters.usage }}
      location: ${{ parameters.location }}
      classification: ${{ parameters.classification }}
      existsIn: ${{ parameters.existsIn }}
      system: ${{ parameters.system }}
      dependencyOf: ${{ parameters.dependencyOf }}
      dependsOn: []
```

## Complete Template Example

Here's a complete example of a software template that creates a datasource:

```yaml
apiVersion: scaffolder.backstage.io/v1beta3
kind: Template
metadata:
  name: create-datasource
  title: Create a New Datasource
  description: Register a new datasource in Compass
spec:
  owner: group:platform-engineering
  type: datasource

  parameters:
    - title: Basic Information
      required:
        - title
        - namespace
        - owner
        - steward
      properties:
        title:
          title: Datasource Title
          type: string
          description: Human-readable name for the datasource
        name:
          title: Datasource Name (optional)
          type: string
          description: Unique identifier (defaults to kebab-case title)
        namespace:
          title: Namespace
          type: string
          default: default
          description: Namespace for the datasource
        description:
          title: Description
          type: string
          description: What data does this datasource contain?
          ui:widget: textarea
        owner:
          title: Owner
          type: string
          description: Team or user who owns this datasource
          ui:field: OwnerPicker
          ui:options:
            catalogFilter:
              kind: [Group, User]
        steward:
          title: Data Steward
          type: string
          description: Person responsible for data governance
          ui:field: OwnerPicker
          ui:options:
            catalogFilter:
              kind: User

    - title: Classification & Storage
      required:
        - classification
        - type
        - location
        - usage
        - existsIn
      properties:
        aiRelated:
          title: AI Related
          type: boolean
          description: Is this datasource used for AI/ML purposes?
          default: false
        classification:
          title: Data Classification
          type: string
          enum:
            - RH-Public
            - RH-Internal
            - RH-Restricted
            - RH-Restricted(+PII)
          description: Data classification level
        type:
          title: Datasource Type
          type: string
          enum:
            - database
            - s3-bucket
            - api
            - file-system
            - data-lake
          description: Type of datasource
        location:
          title: Location
          type: string
          description: Physical or cloud location (e.g., s3://bucket/path)
        usage:
          title: Usage
          type: string
          description: What is this datasource used for?
          ui:widget: textarea
        existsIn:
          title: Exists In
          type: array
          description: Data stores where this datasource exists
          items:
            type: object
            required: [name]
            properties:
              name:
                type: string
                enum:
                  - GraphQL
                  - XE S3 Bucket
                  - Starburst
                  - Dataverse
                  - Data Warehouse
              description:
                type: string
        system:
          title: System
          type: string
          description: System this datasource belongs to
          ui:field: EntityPicker
          ui:options:
            catalogFilter:
              kind: System
        dependencyOf:
          title: Dependency Of
          type: array
          description: Components that depend on this datasource
          items:
            type: string
            ui:field: EntityPicker

  steps:
    - id: validate
      name: Validate Datasource
      action: datasource:validate
      input:
        name: ${{ parameters.name if parameters.name else parameters.title | kebabCase }}
        title: ${{ parameters.title }}
        namespace: ${{ parameters.namespace }}

    - id: create
      name: Create & Register Datasource
      if: "${{ steps['validate'].output.valid }}"
      action: datasource:create
      input:
        name: ${{ parameters.name if parameters.name else parameters.title | kebabCase }}
        title: ${{ parameters.title }}
        namespace: ${{ parameters.namespace }}
        description: ${{ parameters.description }}
        aiRelated: ${{ "true" if parameters.aiRelated else "false" }}
        owner: ${{ parameters.owner }}
        steward: ${{ parameters.steward }}
        type: ${{ parameters.type }}
        usage: ${{ parameters.usage }}
        location: ${{ parameters.location }}
        classification: ${{ parameters.classification }}
        existsIn: ${{ parameters.existsIn }}
        system: ${{ parameters.system }}
        dependencyOf: ${{ parameters.dependencyOf or [] }}
        dependsOn: []

  output:
    links:
      - title: View Datasource in Catalog
        url: ${{ steps['create'].output.entityRef | parseEntityRef | pick('kind') | lower }}/${{ steps['create'].output.entityRef | parseEntityRef | pick('namespace') }}/${{ steps['create'].output.entityRef | parseEntityRef | pick('name') }}
    text:
      - title: Datasource Created
        content: |
          Successfully created datasource: ${{ steps['create'].output.message }}
```

## Usage in Templates

### Basic Workflow

1. **Validate**: Check if datasource name is available
2. **Create**: Create the datasource if validation passes
3. **Output**: Provide link to the created datasource

### Conditional Execution

Use the validation output to conditionally create the datasource:

```yaml
- id: create
  if: "${{ steps['validate'].output.valid }}"
  action: datasource:create
  input:
    # ... inputs
```

### Using Output Values

Access created datasource information in subsequent steps:

```yaml
- id: log
  name: Log Success
  action: debug:log
  input:
    message: "Created datasource: ${{ steps['create'].output.entityRef }}"
```

## Error Handling

### Validation Errors

The `datasource:validate` action throws a `ConflictError` if:
- A datasource with the same name exists in the database
- A resource entity with the same reference exists in the catalog

### Creation Errors

The `datasource:create` action throws errors if:
- Input validation fails (invalid schema)
- API request fails (network, server errors)
- Catalog registration fails

All errors are logged and will cause the template execution to fail with detailed error messages.

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

### Testing Actions Locally

You can test the actions using the Scaffolder dry run feature:

```bash
# Run template in dry run mode
yarn backstage-cli template:dry-run --template /path/to/template.yaml
```

## Integration Points

### Requires

- `@backstage/plugin-scaffolder-backend` - The core scaffolder plugin
- `@compass/backstage-plugin-datasource-backend` - Backend API for datasource operations
- `@backstage/plugin-catalog-backend` - Catalog service for entity checks

### Uses

- `DatasourceApiClient` from `@compass/backstage-plugin-datasource-common`
- Backstage core services: auth, discovery
- Catalog service for entity validation

## Related Packages

This module is part of the datasource plugin ecosystem:

- **@compass/backstage-plugin-datasource**: Frontend plugin for Backstage UI
- **@compass/backstage-plugin-datasource-backend**: Backend plugin providing the REST API
- **@compass/backstage-plugin-datasource-common**: Shared utilities and types
- **@compass/backstage-plugin-catalog-backend-module-datasource**: Catalog integration module
- **@compass/backstage-plugin-scaffolder-backend-module-datasource**: This package (scaffolder actions)

## Troubleshooting

### Action not found

1. Verify the module is installed and registered in your backend
2. Check that the scaffolder backend plugin is installed
3. Restart your backend application

### Validation always fails

1. Check that the datasource backend API is running
2. Verify catalog service is accessible
3. Check backend logs for authentication errors

### Creation fails with 500 error

1. Verify the datasource backend is running and accessible
2. Check that all required fields are provided
3. Ensure data classification and existsIn values match valid enums
4. Review backend logs for detailed error messages
