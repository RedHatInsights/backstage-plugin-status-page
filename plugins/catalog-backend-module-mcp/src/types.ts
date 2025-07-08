import { SchedulerServiceTaskScheduleDefinition } from '@backstage/backend-plugin-api';
import { Entity } from '@backstage/catalog-model';
import { JsonObject } from '@backstage/types';

export interface MCPRegistryProviderConfig {
  id?: string;
  /**
   * The hostname of the MCP Registry instance
   * e.g. `registry.example.com`
   */
  host: string;
  /**
   * The base URL of the MCP Registry API
   * e.g. `https://registry.example.com/api/`
   */
  apiBaseUrl: string;
  /**
   * Headers to include in requests to the MCP Registry API
   */
  headers?: Record<string, string>;
  /**
   * Overrides for entity metadata and spec
   */
  overrides?: EntityOverrides;
  /**
   * Schedule configuration for refresh tasks
   */
  schedule?: SchedulerServiceTaskScheduleDefinition;
}

export type EntityOverrides = Partial<Pick<Entity, 'metadata' | 'spec'>>;

export interface PagedResponse<T extends any[]> {
  servers: T;
  next?: string;
  total_count: number;
}

export interface MCPRegistryServer {
  id: string;
  name: string;
  description: string;
  repository?: {
    id: string;
    url: string;
    source: string;
  };
  version_detail?: {
    version: string;
    release_date: string;
    is_latest: boolean;
  };
  packages?: Array<Package>;
  remotes?: Array<Remote>;
}

export type Package = {
  registry_name: string;
  name: string;
  version: string;
  runtime_hint: string;
  runtime_arguments?: Array<Arguments>;
  package_arguments?: Array<Arguments>;
  environment_variables?: Array<Variable>;
}

type Arguments = {
  description: string;
  is_required: boolean;
  format: string;
  value: string;
  is_secret: boolean;
  default: string;
  choices: Array<string>;
  variables: {
    [prop: string]: {
      description: string;
      is_required: boolean;
      format: string;
      value: string;
      is_secret: boolean;
      default: string;
      choices: Array<string>;
    };
  };
  is_repeated: boolean;
} & (
  | {
      type: 'named';
      name: string;
    }
  | {
      type: 'positional';
      value_hint: string;
    }
);

type Variable = {
  name: string;
  description: string;
  is_required: boolean;
  format: string;
  value: string;
  is_secret: boolean;
  default: string;
  choices: Array<string>;
  variables: {
    [prop: string]: {
      description: string;
      is_required: boolean;
      format: string;
      value: string;
      is_secret: boolean;
      default: string;
      choices: Array<string>;
    };
  };
};

type Remote = {
  transport_type: string;
  url: string;
  headers: [
    {
      name: string;
      description: string;
      is_required: boolean;
      format: string;
      value: string;
      is_secret: boolean;
      default: string;
      choices: Array<string>;
      variables: {
        [prop: string]: {
          description: string;
          is_required: boolean;
          format: string;
          value: string;
          is_secret: boolean;
          default: string;
          choices: Array<string>;
        };
      };
    },
  ];
};

export interface MCPServerEntity extends Entity {
  apiVersion: 'mcp/v1beta1';
  kind: 'MCPServer';
  spec: Prettify<
    JsonObject & {
      primitives?: Array<{
        type: 'tool' | 'resource' | 'prompt';
        name: string;
      }>;
    } & (LocalServerSpec | RemoteServerSpec)
  >;
}

interface LocalServerSpec {
  type: 'local';
  packages?: Array<Package>;
}
interface RemoteServerSpec {
  type: 'remote';
  remotes?: Array<Remote>;
}

type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};
