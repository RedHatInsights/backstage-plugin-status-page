import { TaskScheduleDefinition } from '@backstage/backend-tasks';
import { Entity } from '@backstage/catalog-model';

export type SPAshipIntegrationConfig = {
  /**
   * The hostname of the SPAship instance
   */
  host?: string;

  /**
   * The base URL of the SPAship API
   * e.g. https://spaship.company.com/api/
   */
  apiBaseUrl?: string;

  /**
   * The API Key for the SPAship API
   * @visibility secret
   */
  apiKey?: string;
};

export type EntityOverride = Partial<Pick<Entity, 'metadata' | 'spec'>>;

export type SPAshipDiscoveryEntityProviderConfig = {
  /**
   * Identifier of the provider, use at the location key for ingested entities
   */
  id: string;

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
   * A list of property names to import from SPAship.
   * (optional) if empty, all the properties are imported.
   */
  properties?: string[];

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
  schedule?: TaskScheduleDefinition;
};

type Timestamps = {
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
};

export namespace SPAship {
  export type Environment = {
    isActive: boolean;
    env: string;
    cluster: 'preprod' | 'prod';
    propertyIdentifier: string;
    url: string;
  } & Timestamps;

  export type Property = {
    title: string;
    identifier: string;
    createdBy: string;
    cmdbCode: string;
    severity: string;
    env: Environment[];
  };

  export type RawApplication = {
    isActive: string;
    identifier: string;
    name: string;
    path: string;
    env: string;
    ref: string;
    accessUrl: string[];
    routerUrl: string[];
    propertyIdentifier: string;
    isContainerized: boolean;
    isGit: boolean;
  } & Timestamps;

  export type Application = {
    environments: Array<{
      env: string;
      ref: string;
      accessUrl: string[];
      routerUrl: string[];
    }>;
    url?: string;
  } & Omit<RawApplication, 'env' | 'ref' | 'accessUrl' | 'routerUrl'>;
}
