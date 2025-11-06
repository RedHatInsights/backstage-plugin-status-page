# Search Backend Module - MCP Actions

This backend module provides MCP (Model Context Protocol) action for interacting with Backstage Search.

## Architecture

This module follows professional SDE best practices with clear separation of concerns:

```
src/
├── actions/                    # MCP action handlers
│   └── searchCatalogAction.ts
├── api/                        # External API clients
│   └── searchClient.ts         # Search API client
├── types/                      # TypeScript type definitions
│   ├── index.ts                # Type exports
│   ├── actions.ts              # Action-specific types
│   └── search.ts               # Search domain types
├── utils/                      # Utility functions and constants
│   ├── constants.ts            # Application constants
│   └── helpers.ts              # Helper functions
├── index.ts                    # Public module exports
└── module.ts                   # Backend module registration
```

## Installation

```bash
# From your Backstage root directory
yarn --cwd packages/backend add @compass/backstage-plugin-search-backend-module-mcp-actions
```

## Setup

Add the module to your backend in `packages/backend/src/index.ts`:

```typescript
// Search MCP Actions
backend.add(import('@compass/backstage-plugin-search-backend-module-mcp-actions'));
```

## Available Action

### search-catalog

Performs full-text search across the Backstage catalog including entities, documentation (TechDocs), and other indexed content.

**Parameters:**
- `term` (required): Search term or query string. Supports fuzzy matching.
- `types` (optional): Filter by document types (e.g., `["software-catalog"]`, `["techdocs"]`)
- `filters` (optional): Additional filters (e.g., `{"kind": "Component", "spec.lifecycle": "production"}`)
- `limit` (optional): Maximum number of results (default: 100, max: 1000). For MCP usage, all relevant results are returned in a single response.

**Returns:** Search results with metadata. All results are returned in one response.

**When to use:**
- User provides partial names or keywords
- Finding entities by tags, labels, or descriptions
- Searching documentation content
- Fuzzy matching and keyword searches

**When NOT to use:**
- Exact entity name lookups (use `get-catalog-entity` instead)
- Structured filtering by exact values (use `list-entities` instead)

## Architecture Patterns

### API Client Pattern
The `SearchClient` class encapsulates all HTTP communication with the Search API:
- Handles authentication token management
- Manages discovery service for API base URL
- Provides type-safe methods for search endpoints
- Centralizes error handling

### Type Safety
All types are defined in the `types/` directory:
- Domain types (Search results, responses)
- Action input/output types
- Filter types

### Utility Functions
Common logic is extracted into reusable utility functions:
- `buildSearchParams()` - URL parameter construction
- `formatError()` - Error message formatting

### Constants
All constants are centralized in `utils/constants.ts`:
- Plugin IDs
- Document types
- Default search limits

## Configuration

The module uses the Search API configuration from your Backstage setup:

```yaml
search:
  collators:
    schedule:
      frequency:
        minutes: 10
      timeout:
        minutes: 15
      initialDelay:
        seconds: 3
```

## Authentication

The module automatically handles authentication with the Search plugin using service-to-service authentication. No additional configuration is required.

## Example Usage (via MCP)

```json
{
  "action": "search-catalog",
  "input": {
    "term": "authentication service",
    "types": ["software-catalog"],
    "filters": {
      "kind": "Component",
      "spec.lifecycle": "production"
    },
    "limit": 100
  }
}
```

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

## API Reference

Based on [Backstage Search API](https://backstage.io/docs/features/search/api/query/)

### GET /query

Query documents with filters:

**Query Parameters:**
- `term` - Search term (required)
- `types` - Document types to filter (optional, repeatable)
- `filters[key]` - Additional filters (optional)
- `pageLimit` - Number of results to return (optional, default: 100, max: 1000)

**Response:**
```json
{
  "results": [...]
}
```

Note: For MCP usage, all relevant results are returned based on the limit parameter.

## License

Apache-2.0
