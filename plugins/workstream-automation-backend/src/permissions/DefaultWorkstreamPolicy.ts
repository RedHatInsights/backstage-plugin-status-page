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
  private allowedUsers: AllowedUsers[];
  private readonly cache: CacheService;
  private CACHE_KEY = 'backstage:rbac:workstream:admins';

  constructor(
    pluginConfig: PluginPermissionConfig,
    private auth: AuthService,
    private catalogApi: CatalogApi,
    cache: CacheService,
  ) {
    this.registeredPermissions = pluginConfig.workstream.permission ?? [];
    this.allowedUsers = pluginConfig.workstream.users ?? [];
    this.cache = cache.withOptions({ defaultTtl: 1800000 }); // Keep the cache for 30 Mins
  }
  private mergeUser(users: AllowedUsers[], newUser: AllowedUsers) {
    const existing = users.find(u => u.name === newUser.name);

    if (existing) {
      const permsSet = new Set([
        ...(existing.permission ?? []),
        ...(newUser.permission ?? []),
      ]);
      existing.permission = Array.from(permsSet);
    } else {
      users.push({ ...newUser });
    }
  }
  private async refreshAndGetUsers() {
    const cachedUsers = await this.cache.get<AllowedUsers[]>(this.CACHE_KEY);
    if (cachedUsers) return cachedUsers;

    const _allowedUsers: AllowedUsers[] = [];
    for (const user of this.allowedUsers) {
      if (
        parseEntityRef(user.name, {
          defaultKind: 'user',
          defaultNamespace: 'redhat',
        }).kind === 'group'
      ) {
        const groupEntity = await this.catalogApi.getEntityByRef(
          user.name,
          await this.auth.getPluginRequestToken({
            targetPluginId: 'catalog',
            onBehalfOf: await this.auth.getOwnServiceCredentials(),
          }),
        );
        groupEntity?.relations
          ?.filter(p => p.type === 'hasMember')
          .forEach(relation =>
            // if user is mututal in some other groups, merge them and update permissions
            this.mergeUser(_allowedUsers, {
              name: relation.targetRef,
              permission: [...(user.permission ?? this.registeredPermissions)],
            }),
          );
      } else {
        this.mergeUser(_allowedUsers, {
          name: user.name,
          permission: [...(user.permission ?? this.registeredPermissions)],
        });
      }
    }
    await this.cache.set(this.CACHE_KEY, _allowedUsers);
    return _allowedUsers;
  }

  async handle(
    request: PolicyQuery,
    user: PolicyQueryUser,
  ): Promise<PolicyDecision> {
    if (!this.registeredPermissions.includes(request.permission.name)) {
      return { result: AuthorizeResult.DENY };
    }

    const allowedUsers = await this.refreshAndGetUsers();
    const userFound = allowedUsers.find(
      p => p.name === user?.info.userEntityRef,
    );
    if (userFound && userFound.permission?.includes(request.permission.name)) {
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
