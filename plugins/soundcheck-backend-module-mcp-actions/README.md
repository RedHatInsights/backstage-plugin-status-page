# Soundcheck Backend Module - MCP Actions

This backend module provides MCP (Model Context Protocol) actions for interacting with Soundcheck in Backstage.

## Architecture

This module follows professional SDE best practices with clear separation of concerns:

```
src/
├── actions/                    # MCP action handlers
│   ├── getSoundcheckAggregationsAction.ts
│   ├── getSoundcheckResultsAction.ts
│   └── listSoundcheckAction.ts
├── api/                        # External API clients
│   └── soundcheckClient.ts     # Soundcheck API client
├── types/                      # TypeScript type definitions
│   ├── index.ts                # Type exports
│   ├── actions.ts              # Action-specific types
│   └── soundcheck.ts           # Soundcheck domain types
├── utils/                      # Utility functions and constants
│   ├── constants.ts            # Application constants
│   └── helpers.ts              # Helper functions
├── index.ts                    # Public module exports
└── module.ts                   # Backend module registration
```

## Installation

```bash
# From your Backstage root directory
yarn --cwd packages/backend add @compass/backstage-plugin-soundcheck-backend-module-mcp-actions
```

## Setup

Add the module to your backend in `packages/backend/src/index.ts`:

```typescript
// Soundcheck MCP Actions
backend.add(import('@compass/backstage-plugin-soundcheck-backend-module-mcp-actions'));
```

## Available Actions

### 1. list-soundcheck-info

Lists Soundcheck checks and tracks.

**Usage:**
- Get all checks: `{ type: "checks" }`
- Get a specific check: `{ type: "check", id: "has-readme" }`
- Get all tracks: `{ type: "tracks" }`
- Get a specific track: `{ type: "track", id: "production" }`

**When to use:** When you need to discover available checks, tracks, or their configurations.

### 2. get-soundcheck-results

Retrieves Soundcheck check results for a specific entity.

**Parameters:**
- `entityRef` (required): Entity reference in format `"kind:namespace/name"`

**Returns:** All check results with pass/fail status and summary statistics.

**When to use:** When you want to see the compliance status of a specific component, system, or API.

### 3. get-soundcheck-aggregations

Retrieves aggregated Soundcheck statistics and pass rates.

**Parameters:**
- `type` (required): Type of aggregation (e.g., `"overallCheckPassRates"`, `"individualEntitiesPassRates"`)
- `numberOfDays` (optional): Historical data range
- `entityKinds`, `entityTypes`, `entityLifecycles` (optional): Filters
- `tracks`, `checkIds`, `entityRefs` (optional): Specific filters

**Returns:** Aggregated statistics, pass rates, and compliance metrics.

**When to use:** When you need overview statistics, trends, or compliance metrics across multiple entities.

## Architecture Patterns

### API Client Pattern
The `SoundcheckClient` class encapsulates all HTTP communication with the Soundcheck API:
- Uses **Discovery API** to automatically resolve plugin URLs for different environments (local, preprod, prod)
- Handles authentication token management
- Provides type-safe methods for API endpoints
- Centralizes error handling

### URL Resolution via Discovery API
The module uses Backstage's Discovery API to automatically resolve the Soundcheck plugin URL based on the environment:
- **Local Development**: Resolves to `http://localhost:7007/api/soundcheck`
- **Preprod/Prod**: Automatically uses the configured backend URLs from `app-config.yaml`
- **Benefits**: No hardcoded URLs, seamless environment transitions, centralized configuration

Configuration example in `app-config.yaml`:
```yaml
backend:
  baseUrl: https://backstage.example.com  # Discovery API uses this
  listen:
    port: 7007
```

### Type Safety
All types are defined in the `types/` directory:
- Domain types (Soundcheck entities)
- Action input/output types
- Response types

### Utility Functions
Common logic is extracted into reusable utility functions:
- `resolveNameToId()` - Name resolution logic
- `calculateCheckSummary()` - Summary calculation
- `buildAggregationFilter()` - Filter building
- `buildSearchParams()` - URL parameter construction
- `formatError()` - Error message formatting

### Constants
All constants are centralized in `utils/constants.ts`:
- Plugin IDs for authentication
- Check states
- Aggregation types
- Resource types

Note: Base URLs are resolved dynamically via Discovery API, not hardcoded.

## Configuration

The module uses the following configuration:

```yaml
backend:
  actions:
    pluginSources:
      - 'soundcheck'  # Must be included to register actions
```

## Authentication

The module automatically handles authentication with the Soundcheck plugin using service-to-service authentication. No additional configuration is required.

## Development

```bash
# Start the module in development mode
yarn start

# Build the module
yarn build

# Run tests
yarn test

# Lint
yarn lint
```

## Best Practices

1. **Separation of Concerns**: Each layer (actions, API, types, utils) has a single responsibility
2. **Type Safety**: Strong typing throughout the codebase
3. **DRY Principle**: Common logic is extracted and reused
4. **Error Handling**: Consistent error handling across all actions
5. **Testability**: Pure functions and dependency injection make testing easy

## License

Apache-2.0
