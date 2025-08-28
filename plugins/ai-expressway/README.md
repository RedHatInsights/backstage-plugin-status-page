# AI Expressway Plugin

Welcome to the AI Expressway plugin for Backstage!

This plugin provides XE AI Expressway initiative information within Backstage, displaying enriched metadata for entities that participate in XE AI initiatives. The plugin automatically shows initiative details including summary, phase, status, tags, and owner information directly on entity pages.

## Features

- **Entity Integration**: Displays XE AI Expressway data as cards on entity overview pages
- **Initiative Details**: Shows comprehensive information including:
  - Initiative ID with direct link to JIRA
  - Summary and description
  - Current phase and status
  - Associated tags
  - Owner information with entity references
- **Conditional Display**: Only appears for entities with XE AI Expressway annotations
- **Modern UI**: Clean, responsive card-based design that integrates seamlessly with Backstage

## Components

- **DetailsCard**: Main card component that displays XE AI Expressway information
- **DetailsContent**: Content component that renders the initiative details
- **DetailsField**: Reusable field component for displaying labeled information

## Installation

Add the plugin to your Backstage app:

```bash
# From your Backstage root directory
yarn --cwd packages/app add @compass/backstage-plugin-ai-expressway
```

## Configuration

### 1. Add to EntityPage

Import and add the component to your `EntityPage.tsx`:

```typescript
import { DetailsCard, isInitiativeAvailable } from '@compass/backstage-plugin-ai-expressway';

// Add to your entity overview content
<EntitySwitch>
  <EntitySwitch.Case if={isInitiativeAvailable}>
    <Grid item lg={6} md={8} xs={12}>
      <DetailsCard />
    </Grid>
  </EntitySwitch.Case>
</EntitySwitch>
```

### 2. Entity Annotations

Entities must have the `xeaixway/initiative` annotation and enriched metadata:

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: my-service
  annotations:
    xeaixway/initiative: "INITIATIVE-123"
  xeaixway:
    id: "INITIATIVE-123"
    summary: "AI-powered feature enhancement"
    phase: "Implementation"
    status: "In Progress"
    owner: "john.doe@company.com"
    tags: ["ai", "enhancement", "q4-2024"]
```

## Development

### Getting Started

You can serve the plugin in isolation by running `yarn start` in the plugin directory.
This method provides quicker iteration speed and faster startup with hot reloads.
The development setup can be found in the [/dev](./dev) directory.

### Testing

Run tests with:

```bash
yarn test
```

Run linting with:

```bash
yarn lint
```

## API Reference

### Components

#### `DetailsCard`
Main component that displays XE AI Expressway initiative information.

#### `isInitiativeAvailable(entity: Entity): boolean`
Utility function to check if an entity has XE AI Expressway data.

### Annotations

- `xeaixway/initiative`: The initiative ID/key (required for the card to display)

### Metadata Structure

The plugin expects enriched metadata in the `xeaixway` property:

```typescript
interface XeaiwayMetadata {
  id?: string;           // Initiative ID
  summary?: string;      // Initiative summary
  phase?: string;        // Current phase
  status?: string;       // Current status
  owner?: string;        // Owner name
  ownerEmail?: string;   // Owner email
  assignee?: string;     // Assignee
  tags?: string[];       // Associated tags
}
```
