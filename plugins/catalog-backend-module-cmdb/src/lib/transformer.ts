import {
  ANNOTATION_EDIT_URL,
  ANNOTATION_LOCATION,
  ANNOTATION_ORIGIN_LOCATION,
  ANNOTATION_VIEW_URL,
  DEFAULT_NAMESPACE,
  Entity,
} from '@backstage/catalog-model';
import { kebabCase, merge } from 'lodash';
import {
  CMDB_ID_ANNOTATION,
  CMDB_APPCODE_ANNOTATION,
  CMDB_IMPORT_TAG,
} from './constants';
import { getViewUrl, toValidUrl } from './utils';
import { CMDBDiscoveryEntityProviderConfig, CMDBRecord } from './types';

export function transformer(
  application: CMDBRecord,
  provider: CMDBDiscoveryEntityProviderConfig,
): Entity {
  const sysId = application.sys_id?.toString()!;
  const location = `url://${provider.host}/api/now/table/cmdb_ci_business_app/${sysId}`;

  const links = application.url
    ? [
        {
          title: 'Application URL',
          url: toValidUrl(application.url.toString()),
        },
      ]
    : undefined;

  const componentEntity: Entity = {
    apiVersion: 'servicenow.com/v1beta1',
    kind: 'BusinessApplication',
    metadata: {
      name: kebabCase(application.name?.toString()),
      title: application.name?.toString(),
      description: application.short_description?.toString() ?? undefined,
      annotations: {
        [ANNOTATION_LOCATION]: location,
        [ANNOTATION_ORIGIN_LOCATION]: location,
        [ANNOTATION_VIEW_URL]: getViewUrl(provider.host, sysId),
        [ANNOTATION_EDIT_URL]: getViewUrl(provider.host, sysId),

        [CMDB_ID_ANNOTATION]: sysId,

        ...(application.u_application_id ? {
          [CMDB_APPCODE_ANNOTATION]: application.u_application_id.toString(),
        } : undefined),
      },
      tags: [CMDB_IMPORT_TAG],
      namespace: DEFAULT_NAMESPACE,
      links,
      sysUpdatedAt: application.sys_updated_on,
      updatedAt: new Date().toISOString(),
    },
    spec: {
      type: 'website',
      lifecycle:
        application.install_status !== '1' ? 'preproduction' : 'production',
      owner: `user:redhat/${application['owned_by.user_name']}`,
    },
  };

  /* TODO: Add transformer support */

  const overrides = provider.overrides;

  return merge(componentEntity, overrides);
}
