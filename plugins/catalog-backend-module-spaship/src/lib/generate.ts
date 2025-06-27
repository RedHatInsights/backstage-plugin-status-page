import {
  ANNOTATION_EDIT_URL,
  ANNOTATION_LOCATION,
  ANNOTATION_ORIGIN_LOCATION,
  ANNOTATION_VIEW_URL,
  ComponentEntity,
  DEFAULT_NAMESPACE,
  SystemEntity,
} from '@backstage/catalog-model';
import { SPAship, SPAshipDiscoveryEntityProviderConfig } from './types';
import { kebabCase, merge } from 'lodash';
import {
  ANNOTATIONS_CMDB_APPCODE,
  ANNOTATIONS_SPASHIP_APPLICATION_IDENTIFIER,
  ANNOTATION_SPASHIP_PROPERTY_IDENTIFIER,
  SPASHIP_IMPORT_TAG,
} from './constants';
import { mapper } from './mapper';
import { LoggerService } from '@backstage/backend-plugin-api';

export function generateSystemEntity(
  property: SPAship.Property,
  provider: SPAshipDiscoveryEntityProviderConfig,
  logger?: LoggerService,
) {
  const location = `url://${provider.host}/api/v1/properties/?identifier=${property.identifier}`;
  const viewUrl = `https://${provider.host}/properties/${property.identifier}`;

  const owner =
    property.createdBy?.split('@')?.[0] &&
    property.createdBy?.split('@')?.[0] !== 'NA'
      ? `user:${provider.defaultOwnerNamespace ?? DEFAULT_NAMESPACE}/${
          property.createdBy.split('@')[0]
        }`
      : 'unknown';

  if (!property.identifier) {
    logger?.debug('Property: ', property);
  }

  const system: SystemEntity = {
    apiVersion: 'backstage.io/v1beta1',
    kind: 'System',
    metadata: {
      name: kebabCase(property.identifier ?? property.title),
      title: property.title,
      annotations: {
        [ANNOTATION_LOCATION]: location,
        [ANNOTATION_ORIGIN_LOCATION]: location,
        [ANNOTATION_VIEW_URL]: viewUrl,
        [ANNOTATION_EDIT_URL]: viewUrl,

        [ANNOTATION_SPASHIP_PROPERTY_IDENTIFIER]: property.identifier,

        ...(property.cmdbCode && property.cmdbCode.toUpperCase() !== 'NA'
          ? { 'servicenow.com/appcode': property.cmdbCode }
          : undefined),
      },
      namespace: DEFAULT_NAMESPACE,
      updatedAt: new Date().toISOString(),
      tags: [SPASHIP_IMPORT_TAG],
    },
    spec: {
      owner,
    },
  };

  const overrides = provider.overrides;
  const customMappings = mapper(property, provider.customPropertyMappings);

  return merge(system, overrides, customMappings);
}

export function generateComponentEntity(
  application: SPAship.Application,
  provider: SPAshipDiscoveryEntityProviderConfig,
  options: {
    cmdbCode?: string;
    systemRef?: string;
    lifecycle?: string;
  },
  logger?: LoggerService,
) {
  const location = `url://${provider.host}/api/v1/properties/?applicationIdentifier=${application.identifier}`;
  const viewUrl = `https://${provider.host}/properties/${application.identifier}`;

  const owner =
    application.createdBy?.split('@')?.[0] &&
    application.createdBy?.split('@')?.[0] !== 'NA'
      ? `user:${provider.defaultOwnerNamespace ?? DEFAULT_NAMESPACE}/${
          application.createdBy.split('@')[0]
        }`
      : 'unknown';

  if (!application.identifier) {
    logger?.debug('application:', application);
  }

  const component: ComponentEntity = {
    apiVersion: 'backstage.io/v1beta1',
    kind: 'Component',
    metadata: {
      name: kebabCase(application.identifier ?? application.name),
      title: application.name ?? application.identifier,
      annotations: {
        [ANNOTATION_LOCATION]: location,
        [ANNOTATION_ORIGIN_LOCATION]: location,
        [ANNOTATION_VIEW_URL]: viewUrl,
        [ANNOTATION_EDIT_URL]: viewUrl,

        [ANNOTATION_SPASHIP_PROPERTY_IDENTIFIER]:
          application.propertyIdentifier,
        [ANNOTATIONS_SPASHIP_APPLICATION_IDENTIFIER]: application.identifier,

        ...(options.cmdbCode && options.cmdbCode.toUpperCase() !== 'NA'
          ? { [ANNOTATIONS_CMDB_APPCODE]: options.cmdbCode }
          : undefined),
      },
      namespace: DEFAULT_NAMESPACE,
      updatedAt: new Date().toISOString(),
      tags: [SPASHIP_IMPORT_TAG],
    },
    spec: {
      owner,
      system: options.systemRef,
      type: 'website',
      lifecycle: options.lifecycle ?? 'preproduction',
    },
  };

  const overrides = provider.overrides;
  const customMappings = mapper(
    application,
    provider.customApplicationMappings,
  );

  return merge(component, overrides, customMappings);
}
