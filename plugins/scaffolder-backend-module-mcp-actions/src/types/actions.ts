/**
 * Action Input/Output Types for Scaffolder MCP Actions
 */

export interface ListActionsInput {
  dummy?: any;
}

export interface ListTemplatesInput {
  dummy?: any;
}

export interface GetTemplateInput {
  templateRef: string;
}

export interface TriggerTemplateInput {
  templateRef: string;
  values: Record<string, any>;
}

export interface GetTaskStatusInput {
  taskId: string;
}

export interface GetTaskLogsInput {
  taskId: string;
  after?: number;
}

export interface ListTasksInput {
  dummy?: any;
}

export interface CancelTaskInput {
  taskId: string;
}

