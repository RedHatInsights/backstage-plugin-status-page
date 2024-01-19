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
  ANNOTATION_CMDB_APPCODE,
  ANNOTATION_CMDB_ID,
  CMDB_IMPORT_TAG,
} from './constants';
import { getViewUrl, toValidUrl } from './utils';
import { BusinessApplicationEntity, CMDBDiscoveryEntityProviderConfig, CMDBMeta, CMDBRecord } from './types';

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

  const businessApplicationEntity: BusinessApplicationEntity = {
    apiVersion: 'servicenow.com/v1beta1',
    kind: 'BusinessApplication',
    metadata: {
      name: kebabCase(application.name!.toString()),
      title: application.name!.toString(),
      description: application.short_description?.toString() ?? undefined,
      annotations: {
        [ANNOTATION_LOCATION]: location,
        [ANNOTATION_ORIGIN_LOCATION]: location,
        [ANNOTATION_VIEW_URL]: getViewUrl(provider.host, sysId),
        [ANNOTATION_EDIT_URL]: getViewUrl(provider.host, sysId),

        [ANNOTATION_CMDB_ID]: sysId,

        ...(application.u_application_id ? {
          [ANNOTATION_CMDB_APPCODE]: application.u_application_id.toString(),
        } : undefined),
      },
      tags: [CMDB_IMPORT_TAG],
      namespace: DEFAULT_NAMESPACE,
      links,
      sysUpdatedAt: application.sys_updated_on,
      updatedAt: new Date().toISOString(),
      cmdb: {
        ...(cmdbRecordToCMDBMeta(application)),
      }
    },
    spec: {
      lifecycle:
        application.install_status !== '1' ? 'preproduction' : 'production',
      owner: `user:redhat/${application['owned_by.user_name']}`,
    },
  };

  /* TODO: Add custom transformer support */

  const overrides = provider.overrides;

  return merge(businessApplicationEntity, overrides);
}

function cmdbRecordToCMDBMeta (record: CMDBRecord): CMDBMeta {
  return {
    title: record.name?.toString()!,
    ownedBy: record['owned_by.user_name']?.toString()!,
    ownedByActive: record['owned_by.active']?.toString() === "true",
    installStatus: record.install_status?.toString()!,
    businessCriticality: record.business_criticality?.toString()!,
    applicationType: record.application_type?.toString(),
    dataClassification: record.data_classification?.toString(),
    lifecycleStateStatus: record.life_cycle_stage_status?.toString(),
    supportGroup: record.support_group?.toString(),
  };
}
