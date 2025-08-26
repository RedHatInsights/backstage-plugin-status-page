# JIRA Backend Module for Backstage Catalog

This backend module provides a JIRA EntityProcessor that enriches existing catalog entities with JIRA issue information, following the same pattern as the CMDB module.

## Features

- **EntityProcessor** - enriches existing entities, doesn't create new ones
- Uses the existing **Backstage JIRA proxy** - no custom integration needed
- Adds JIRA data to entity metadata for UI consumption
- Supports priority-based phase detection from JIRA components
- Automatic labeling for easy filtering

## Installation

The module is already registered in your backend.

## Configuration

This module uses the existing JIRA proxy configuration from your `app-config.yaml`:

```yaml
proxy:
  endpoints:
    '/jira':
      target: ${JIRA_URL}
      credentials: dangerously-allow-unauthenticated
      changeOrigin: true
      allowedMethods: ['GET']
      headers:
        Authorization: ${JIRA_TOKEN}
        Accept: 'application/json'
        Content-Type: 'application/json'
        X-Atlassian-Token: 'no-check'
        User-Agent: 'Backstage-Jira-Plugin'
```

### Environment Variables

- `JIRA_URL`: Your JIRA instance URL (e.g., `https://issues.redhat.com`)
- `JIRA_TOKEN`: Your JIRA API token (format: `Basic base64(email:token)`)

## Usage

### Entity Annotation

Add the `xeaixway/initiative` annotation to your catalog entities:

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: my-service
  annotations:
    xeaixway/initiative: "XEAIXWAY-95"
spec:
  type: service
  lifecycle: production
```

### Entity Enrichment

The processor adds the following to entity metadata:

1. **Annotations** for searchability:
   - `xeaixway/initiative-summary`
   - `xeaixway/initiative-status`
   - `xeaixway/initiative-type`
   - `xeaixway/initiative-assignee`
   - `xeaixway/initiative-url`

2. **Labels** for filtering:
   - `xeaixway-initiative`
   - `xeaixway-status-{status}`
   - `xeaixway-type-{type}`

3. **Metadata object** (`metadata.xeaixway`) for UI consumption:
   ```typescript
   {
     id: string;
     summary: string;
     phase?: string;           // Priority: PRE-ALPHA > ALPHA > BETA > GA
     assignee?: string;
     owner?: string;
     ownerEmail?: string;
     status: string;
     statusColor: string;
     tags: string[];           // Non-priority components
     url: string;
     created: string;
     updated: string;
   }
   ```

## Architecture

This follows the same pattern as the CMDB module:
- **EntityProcessor** for enriching existing entities
- **No EntityProvider** - we don't create new entities
- Uses existing Backstage proxy infrastructure
- Minimal, focused implementation