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
  BusinessApplicationApiVersion,
  CMDB_IMPORT_TAG,
} from './constants';
import { getInstallStatus, getInstallStatusLabel, getViewUrl, sanitizeUrl } from './utils';
import {
  BusinessApplicationEntity,
  CMDBDiscoveryEntityProviderConfig,
  CMDBMeta,
  CMDBRecord,
} from './types';

export function transformer(
  application: CMDBRecord,
  provider: CMDBDiscoveryEntityProviderConfig,
): Entity {
  const sysId = application.sys_id?.toString()!;
  const location = `url://${provider.host}/api/now/table/cmdb_ci_business_app/${sysId}`;

  const url = sanitizeUrl(application.url);
  const links = url
    ? [
        {
          title: 'Application URL',
          url,
        },
      ]
    : undefined;

  const businessApplicationEntity: BusinessApplicationEntity = {
    apiVersion: BusinessApplicationApiVersion,
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

        ...(application.u_application_id
          ? {
              [ANNOTATION_CMDB_APPCODE]:
                application.u_application_id.toString(),
            }
          : undefined),
      },
      tags: [CMDB_IMPORT_TAG],
      namespace: DEFAULT_NAMESPACE,
      links,
      sysUpdatedAt: application.sys_updated_on,
      updatedAt: new Date().toISOString(),
      cmdb: {
        ...cmdbRecordToCMDBMeta(application),
      },
    },
    spec: {
      lifecycle: getInstallStatus(application.install_status),
      owner: `user:redhat/${application['owned_by.user_name']}`,
    },
  };

  /* TODO: Add custom transformer support */

  const overrides = provider.overrides;

  return merge(businessApplicationEntity, overrides);
}

function cmdbRecordToCMDBMeta(record: CMDBRecord): CMDBMeta {
  return {
    sysId: record.sys_id?.toString()!,
    title: record.name?.toString()!,
    ownedBy: record['owned_by.user_name']?.toString()!,
    ownedByActive: record['owned_by.active']?.toString() === 'true',
    installStatus: record.install_status?.toString()!,
    installStatusLabel: getInstallStatusLabel(record.install_status),
    businessCriticality: record.business_criticality?.toString()!,
    applicationType: record.application_type?.toString(),
    dataClassification: record.data_classification?.toString(),
    lifecycleStage: record['life_cycle_stage.name']?.toString(),
    lifecycleStageStatus: record['life_cycle_stage_status.name']?.toString(),
    supportGroup: record['support_group.name']?.toString(),
  };
}
