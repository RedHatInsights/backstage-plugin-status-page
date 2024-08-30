import {
  RESOURCE_TYPE_WORKSTREAM_ENTITY,
  workstreamPermissions,
} from '@appdev-platform/backstage-plugin-workstream-automation-common';
import {
  AuthorizeResult,
  isPermission,
  isResourcePermission,
  Permission,
  PolicyDecision,
} from '@backstage/plugin-permission-common';
import {
  PermissionPolicy,
  PolicyQuery,
  PolicyQueryUser,
} from '@backstage/plugin-permission-node';
import {
  createWorkstreamConditionalDecision,
  workstreamConditions,
} from './utils/conditionExports';
import { AuthService, CacheService } from '@backstage/backend-plugin-api';
import { CatalogApi } from '@backstage/catalog-client';
import { parseEntityRef } from '@backstage/catalog-model';

type AllowedUsers = {
  name: string;
  permission?: string[];
};

type PluginPermissionConfig = {
  [pluginId: string]: {
    permission?: string[];
    users: AllowedUsers[];
  };
};

export const isWorkstreamPermission = (permission: Permission) =>
  Object.values(workstreamPermissions).some(workstreamPermission =>
    isPermission(permission, workstreamPermission),
  );

export class WorkstreamPolicy implements PermissionPolicy {
  private registeredPermissions: string[];
  private CACHE_KEY = 'backstage:rbac:workstream:admins';

  constructor(
    private pluginConfig: PluginPermissionConfig,
    private auth: AuthService,
    private catalogApi: CatalogApi,
    private cache: CacheService,
  ) {
    this.registeredPermissions = pluginConfig.workstream.permission ?? [];
  }

  async handle(
    request: PolicyQuery,
    user: PolicyQueryUser,
  ): Promise<PolicyDecision> {
    if (!this.registeredPermissions.includes(request.permission.name)) {
      return { result: AuthorizeResult.DENY };
    }

    if (!(await this.cache.get<AllowedUsers[]>(this.CACHE_KEY))) {
      const allowedUsers: AllowedUsers[] = [];
      for (const admin of this.pluginConfig.workstream.users) {
        if (
          parseEntityRef(admin.name, {
            defaultKind: 'user',
            defaultNamespace: 'redhat',
          }).kind === 'group'
        ) {
          const groupEntity = await this.catalogApi.getEntityByRef(
            admin.name,
            await this.auth.getPluginRequestToken({
              onBehalfOf: await this.auth.getOwnServiceCredentials(),
              targetPluginId: 'catalog',
            }),
          );
          groupEntity?.relations?.forEach(
            r =>
              r.type === 'hasMember' &&
              allowedUsers.push({ name: r.targetRef }),
          );
        } else allowedUsers.push(admin);
      }
      await this.cache.set(this.CACHE_KEY, allowedUsers, { ttl: 1800000 }); // Keep the cache for 30 Mins
    }

    const workstreamAdminUsers = await this.cache.get<AllowedUsers[]>(
      this.CACHE_KEY,
    );
    if (workstreamAdminUsers?.some(p => p.name === user.info.userEntityRef)) {
      return { result: AuthorizeResult.ALLOW };
    }

    if (
      isResourcePermission(request.permission, RESOURCE_TYPE_WORKSTREAM_ENTITY)
    ) {
      return createWorkstreamConditionalDecision(
        request.permission,
        workstreamConditions.isWorkstreamLead({
          claim: user?.info.userEntityRef ?? '',
        }),
      );
    }

    return { result: AuthorizeResult.DENY };
  }
}
