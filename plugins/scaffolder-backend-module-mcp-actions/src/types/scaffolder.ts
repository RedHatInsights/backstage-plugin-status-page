/**
 * Scaffolder API Types
 * Based on: https://backstage.io/docs/features/software-templates/
 */

export interface TemplateParameter {
  title: string;
  description?: string;
  type: string;
  default?: any;
  enum?: string[];
  properties?: Record<string, TemplateParameter>;
  required?: string[];
}

export interface TemplateMetadata {
  name: string;
  title: string;
  description?: string;
  tags?: string[];
  namespace?: string;
  annotations?: Record<string, string>;
}

export interface TemplateSpec {
  type: string;
  owner?: string;
  parameters?: TemplateParameter[];
  steps?: TemplateStep[];
  output?: Record<string, string>;
}

export interface TemplateStep {
  id: string;
  name: string;
  action: string;
  input?: Record<string, any>;
}

export interface Template {
  apiVersion: string;
  kind: string;
  metadata: TemplateMetadata;
  spec: TemplateSpec;
}

export interface TemplateListItem {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace: string;
    title?: string;
    description?: string;
    tags?: string[];
  };
  spec: {
    type: string;
    owner?: string;
  };
}

export interface ScaffolderTask {
  id: string;
  spec: {
    templateInfo: {
      entityRef: string;
    };
    values: Record<string, any>;
    user?: {
      entity?: string;
      ref?: string;
    };
  };
  status: 'open' | 'processing' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  lastHeartbeatAt?: string;
}

export interface TaskStep {
  id: string;
  name: string;
  action: string;
  status: 'open' | 'processing' | 'completed' | 'failed' | 'skipped';
  startedAt?: string;
  endedAt?: string;
}

export interface TaskEventLog {
  type: 'log' | 'completion' | 'cancelled';
  body: {
    message?: string;
    stepId?: string;
    status?: string;
    output?: Record<string, any>;
    error?: {
      name: string;
      message: string;
      stack?: string;
    };
  };
  createdAt: string;
}

export interface ScaffolderTaskDetails extends ScaffolderTask {
  steps?: TaskStep[];
}

export interface ScaffolderResponse<T> {
  items?: T[];
  [key: string]: any;
}

export interface ScaffolderActionSchema {
  id: string;
  description?: string;
  schema?: {
    input?: Record<string, any>;
    output?: Record<string, any>;
  };
}

export interface ScaffolderAction {
  id: string;
  description?: string;
  schema?: {
    input?: {
      type?: string;
      required?: string[];
      properties?: Record<string, any>;
    };
    output?: {
      type?: string;
      properties?: Record<string, any>;
    };
  };
  examples?: Array<{
    description?: string;
    example: string;
  }>;
}

