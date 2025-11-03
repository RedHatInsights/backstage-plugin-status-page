# Datasource Frontend Plugin

A Backstage frontend plugin providing custom scaffolder field extensions and UI components for the datasource plugin ecosystem. This plugin enables enhanced user experiences when working with datasources in Backstage templates and forms.

## Features

- **EntityFacetPicker Field Extension**: A custom scaffolder field that allows users to select values from any catalog entity facet
- **Datasource API Integration**: Built-in API client for interacting with the datasource backend
- **Single & Multiple Selection**: Supports both single-select and multi-select modes
- **Entity Filtering**: Filter options by entity kinds (e.g., Component, Resource, System)
- **Usage Counts**: Optionally display how many entities use each facet value
- **Autocomplete UI**: User-friendly autocomplete interface with free-form text input

## Installation

Install the plugin in your Backstage app:

```bash
# From your Backstage root directory
yarn --cwd packages/app add @compass/backstage-plugin-datasource
```

## Setup

### 1. Register the Plugin

Add the plugin to your app in `packages/app/src/App.tsx`:

```tsx
import { datasourcePlugin } from '@compass/backstage-plugin-datasource';

// ... your app configuration
```

### 2. Register the Scaffolder Field Extension

To use the `EntityFacetPicker` field in your templates, register it with the scaffolder in `packages/app/src/App.tsx`:

```tsx
import {
  datasourcePlugin,
  EntityFacetPickerFieldExtension,
} from '@compass/backstage-plugin-datasource';

const app = createApp({
  // ... other config
  plugins: [
    // ... other plugins
    datasourcePlugin,
  ],
});

const routes = (
  // ... other routes
    <Route path="/create" element={<ScaffolderPage />}>
      <ScaffolderFieldExtensions>
        <EntityFacetPickerFieldExtension />
      </ScaffolderFieldExtensions>
    </Route>
)
```

## Usage

### EntityFacetPicker in Templates

Once registered, you can use the `EntityFacetPicker` field in your Backstage templates to allow users to select values from any entity facet.

#### Basic Example

```yaml
apiVersion: scaffolder.backstage.io/v1beta3
kind: Template
metadata:
  name: example-template
  title: Example Template
spec:
  parameters:
    - title: Select Namespace
      properties:
        namespace:
          title: Namespace
          type: string
          description: Select a namespace from existing entities
          ui:field: EntityFacetPicker
          ui:options:
            facet: metadata.namespace
```

#### Multiple Selection

```yaml
parameters:
  - title: Select Tags
    properties:
      tags:
        title: Tags
        type: array
        description: Select one or more tags
        ui:field: EntityFacetPicker
        ui:options:
          facet: metadata.tags
          multiple: true
```

#### With Entity Filtering

```yaml
parameters:
  - title: Select Component Owner
    properties:
      owner:
        title: Owner
        type: string
        description: Select an owner from existing components
        ui:field: EntityFacetPicker
        ui:options:
          facet: spec.owner
          kinds:
            - Component
            - API
```

#### With Usage Counts

```yaml
parameters:
  - title: Select System
    properties:
      system:
        title: System
        type: string
        description: Select a system (sorted by usage)
        ui:field: EntityFacetPicker
        ui:options:
          facet: spec.system
          showCounts: true
```

### UI Options Reference

The `EntityFacetPicker` field accepts the following `ui:options`:

| Option       | Type     | Required | Default | Description                                                             |
| ------------ | -------- | -------- | ------- | ----------------------------------------------------------------------- |
| `facet`      | string   | Yes      | -       | The facet path to use (e.g., `metadata.namespace`, `spec.owner`)        |
| `kinds`      | string[] | No       | -       | Filter entities by kind (e.g., `['Component', 'Resource']`)             |
| `showCounts` | boolean  | No       | false   | Display usage counts next to each option (sorted by count when enabled) |
| `multiple`   | boolean  | No       | false   | Allow multiple selections (returns array instead of string)             |

### Output Format

- **Single selection** (`multiple: false`): Returns a string value
- **Multiple selection** (`multiple: true`): Returns an array of strings

## API Integration

The plugin provides an API client for interacting with the datasource backend:

```tsx
import { useApi } from '@backstage/core-plugin-api';
import { datasourceApiRef } from '@compass/backstage-plugin-datasource';

export const MyComponent = () => {
  const datasourceApi = useApi(datasourceApiRef);

  const fetchDatasources = async () => {
    const datasources = await datasourceApi.listDatasources({});
    return datasources;
  };

  // ... component logic
};
```

The API client is automatically configured with the correct discovery and fetch APIs when the plugin is registered.

## Development

### Running Standalone

Start the plugin in isolation for rapid development:

```bash
cd plugins/datasource
yarn start
```

This serves the plugin at `http://localhost:3000` with hot reload enabled.

### Running with Full App

Start the entire Backstage application:

```bash
# From the root directory
yarn start
```

Then navigate to the scaffolder to test templates using the `EntityFacetPicker` field.

### Testing

Run the test suite:

```bash
cd plugins/datasource
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

## Architecture

The plugin follows Backstage's plugin architecture:

- **Plugin Definition** (`src/plugin.ts`): Core plugin registration and API factory
- **API Layer** (`src/api/`): API reference definitions
- **Components** (`src/components/`): React components including scaffolder field extensions
- **Routes** (`src/routes.ts`): Route definitions for the plugin
- **Types**: Shared via `@compass/backstage-plugin-datasource-common`

## Related Packages

This plugin is part of the datasource plugin ecosystem:

- **@compass/backstage-plugin-datasource**: This package (frontend plugin)
- **@compass/backstage-plugin-datasource-backend**: Backend API for datasource management
- **@compass/backstage-plugin-datasource-common**: Shared types, validators, and API client
- **@compass/backstage-plugin-catalog-backend-module-datasource**: Catalog backend integration
- **@compass/backstage-plugin-scaffolder-backend-module-datasource**: Scaffolder backend actions

## Contributing

Contributions are welcome! Please ensure:

1. All tests pass (`yarn test`)
2. Code is properly linted (`yarn lint`)
3. Type checking passes (`yarn tsc`)
4. Changes are documented in this README

