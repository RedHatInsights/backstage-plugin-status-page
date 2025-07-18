import { Entity } from '@backstage/catalog-model';
import { JsonObject } from '@backstage/types';

type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type Package = {
  type: string;
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
