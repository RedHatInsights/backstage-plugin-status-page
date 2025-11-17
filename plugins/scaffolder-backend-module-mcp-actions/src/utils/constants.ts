/**
 * Constants for Scaffolder MCP Actions
 */

// Plugin ID for authentication and discovery
export const SCAFFOLDER_PLUGIN_ID = 'scaffolder';

// Task status values
export const TASK_STATUS = {
  OPEN: 'open',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

// Scaffolder API endpoints
export const SCAFFOLDER_API_ENDPOINTS = {
  LIST_ACTIONS: '/v2/actions',
  LIST_TEMPLATES: '/v2/templates',
  GET_TEMPLATE: '/v2/templates',
  TRIGGER_TEMPLATE: '/v2/tasks',
  GET_TASK: '/v2/tasks',
  LIST_TASKS: '/v2/tasks',
  CANCEL_TASK: '/v2/tasks',
  GET_TASK_LOGS: '/v2/tasks',
} as const;

