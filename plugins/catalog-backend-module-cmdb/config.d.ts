import { TaskScheduleDefinitionConfig } from '@backstage/backend-tasks';
import { EntityOverride } from './src/lib';

export interface Config {
  integrations?: {
    servicenow?: Array<{
      /**
       * The hostname of the servicenow instance
       * @visibility frontend
       */
      host: string;
      /**
       * The base URL of the ServiceNow API
       * e.g. https://company.service-now.com/api/now/
       */
      apiBaseUrl: string;
      /**
       * The credentials used for authentication
       * @deepVisibility secret
       */
      credentials?: {
        /**
         * The username to use for authenticated requests
         * @visibility secret
         */
        username: string;
        /**
         * The password to use for authenticated requests
         * @visibility secret
         */
        password: string;
      };
    }>;
  };
  catalog?: {
    providers?: {
      /**
       * CMDBDiscoveryEntityProvider configuration
       */
      cmdb?: {
        [providerId: string]: {
          /**
           * (Required) Host name of the ServiceNow instance
           */
          host: string;
          /**
           * (Required) A Query that can be executed on the CMDB Table APIs to get the entities to be processed
           */
          sysparmQuery: string;
          /**
           * Number of records to query at a time (default: 100)
           */
          querySize?: number;
          /**
           * Map the cmdb record with entity fields
           */
          customMappings?: {
            [field: string]: string;
          };
          /**
           * Custom fields to query
           */
          additionalQueryFields?: string[];
          /**
           * Overrides the generated entity
           */
          overrides?: EntityOverride;
          /**
           * Schedule configuration for refresh tasks
           */
          schedule?: TaskScheduleDefinitionConfig;
        };
      };
    };
  };
}
