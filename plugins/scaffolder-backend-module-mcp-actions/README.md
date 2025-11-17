# Scaffolder MCP Actions Backend Module

This is a Backstage backend module that provides MCP (Model Context Protocol) actions for interacting with the Backstage Scaffolder API.

## Overview

This module registers multiple MCP actions that allow AI agents and external tools to interact with the Scaffolder plugin programmatically. These actions enable discovering, triggering, monitoring, and managing software template executions.

## Available Actions

### 1. **list-scaffolder-actions**
- **Description**: List all installed scaffolder actions
- **Input**: None required
- **Output**: Array of action objects with IDs, descriptions, and schemas

### 2. **get-scaffolder-templates**
- **Description**: List all available software templates
- **Input**: None required
- **Output**: Array of template objects with metadata, types, and owners

### 3. **trigger-scaffolder-template**
- **Description**: Execute a template with provided input values
- **Input**: 
  - `templateRef`: Template entity reference
  - `values`: Template input parameters
- **Output**: Task ID and status

### 4. **list-scaffolder-tasks**
- **Description**: List recent scaffolder tasks
- **Input**: None required
- **Output**: Array of task objects with statuses and creation times

### 5. **get-scaffolder-task**
- **Description**: Get detailed status and information for a specific task
- **Input**: `taskId` - The task ID
- **Output**: Task details including steps and status

### 6. **cancel-scaffolder-task**
- **Description**: Cancel a running scaffolder task
- **Input**: `taskId` - The task ID to cancel
- **Output**: Success confirmation

### 7. **get-scaffolder-task-logs**
- **Description**: Retrieve execution logs for a task
- **Input**: 
  - `taskId` - The task ID
  - `after` - Optional event ID to filter logs
- **Output**: Array of log entries

## Installation

This module is automatically loaded as part of the Backstage backend. Ensure it's included in your backend's `package.json`:

```json
{
  "dependencies": {
    "@compass/backstage-plugin-scaffolder-backend-module-mcp-actions": "*"
  }
}
```

And registered in your backend `index.ts`:

```typescript
backend.add(import('@compass/backstage-plugin-scaffolder-backend-module-mcp-actions'));
```

## Authentication

All actions use the Backstage authentication service to obtain credentials for the Scaffolder plugin. Ensure proper permissions are configured.

## Reference

- [Scaffolder API Documentation](https://backstage.io/docs/category/scaffolder-api)
- [Backstage Backend Plugin API](https://backstage.io/docs/backend-system)
