# Catalog Backend Module MCP Plugin

_This plugin was created through the Backstage CLI._

The **catalog-backend-module-mcp** is a Backstage backend plugin module that extends the Backstage catalog with support for MCP (Model Context Protocol) integration. This module enables Backstage to ingest, synchronize, and manage entities from MCP-compliant sources, enhancing your software catalog with additional data and automation.

## Features

- Integrates MCP data sources with the Backstage catalog
- Supports entity ingestion, synchronization, and updates
- Customizable mapping between MCP entities and Backstage catalog entities
- Designed for extensibility and scalability

## Installation

1. Add the plugin to your Backstage backend:

   ```sh
   yarn workspace backend add @compass/backstage-plugin-catalog-backend-module-mcp
   ```

2. Register the module in your Backstage backend in `packages/backend/src/index.ts`:
   
   ```ts
   const backend = createBackend();

   backend.add(import('@compass/backstage-plugin-catalog-backend-module-mcp'));
   ```

## Configuration

Configure the MCP integration in your Backstage backend configuration (e.g., `app-config.yaml`):

```yaml
catalog:
  catalog:
  providers:
    mcp:
      - host: mcp-registry-example
        apiBaseUrl: https://mcp-registry.example.com/v1/
        headers:
          Content-Type: application/json
          Authorization: "Bearer ${API_KEY}"
        overrides:
          metadata:
            namespace: example
        schedule:
          frequency:
            minutes: 5
          timeout:
            seconds: 15
```

## Usage

Once configured, the plugin will automatically ingest and synchronize entities from the specified MCP source. You can customize mapping and processing logic as needed for your environment.

## Development

- Source code: `plugins/catalog-backend-module-mcp/`
- To run or test the plugin locally, use the standard Backstage backend development workflow:

  ```sh
  yarn start-backend
  ```
