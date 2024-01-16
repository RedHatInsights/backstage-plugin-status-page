import { TaskScheduleDefinitionConfig } from '@backstage/backend-tasks';
import { EntityOverride, SPAship } from './src/lib';

export interface Config {
  integrations?: {
    spaship?: Array<{
      /**
       * The hostname of the SPAship instance
       */
      host: string;
      /**
       * The base URL of the SPAship API
       * e.g. https://spaship.company.com/api/
       */
      apiBaseUrl: string;
      /**
       * The API Key for the SPAship API
       * @visibility secret
       */
      apiKey: string;
    }>;
  };
  catalog?: {
    providers?: {
      /**
       * SPAshipDiscoveryEntityProvider configuration
       */
      spaship?: {
        /**
         * A unique provider id to differentiate between multiple providers (if any)
         */
        [providerId: string]: {
          /**
           * (Required) Host name of the SPAship instance
           * (Should match one of the integrations defined in integrations.spaship in backstage app-config)
           */
          host: string;
          /**
           * A default namespace for the owners of the generated entities.
           * Defaults to the DEFAULT_NAMESPACE of the backstage instance.
           * 
           * You can add a custom/derived namespace by using the customMappings instead.
           */
          defaultOwnerNamespace?: string;
          /**
           * A list of SPAship properties to exlude from being ingested into backstage catalog.
           */
          excludeProperties?: string[];
          /**
           * Map the SPAship property schema with system entity fields
           */
          customPropertyMappings?: {
            [field: string]: string;
          };
          /**
           * Map the SPAship application schema with component entity fields
           */
          customApplicationMappings?: {
            [field: string]: string;
          };
          /**
           * Overrides the generated entity
           * Useful for statically overriding and adding some additional fields to the generated entities before ingestion
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
