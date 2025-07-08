import { SchedulerServiceTaskScheduleDefinition } from '@backstage/backend-plugin-api';

export interface Config {
  catalog: {
    providers: {
      /**
       * **Provider config for MCP Registries**
       *
       * Supports any registry that's compatible with the modelcontextprotocol/registry spec.
       *
       * @visibility backend
       */
      mcp?: Array<{
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
        headers?: {
          /** @visibility secret */
          Authorization?: string;
          /** @visibility secret */
          'X-API-Key'?: string;
          /** @visibility secret */
          'x-api-key'?: string;
          [x: string]: string;
        };
        /**
         * Overrides for entity metadata and spec
         */
        overrides?: EntityOverrides;

        /**
         * Schedule configuration for refresh tasks
         */
        schedule?: SchedulerServiceTaskScheduleDefinition;
      }>;
    };
  };
}
