import {
  isWorkstreamPermission,
  WorkstreamPolicy,
} from '@compass/backstage-plugin-workstream-automation-backend';
import {
  AuthService,
  CacheService,
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { CatalogApi, CatalogClient } from '@backstage/catalog-client';
import { parseEntityRef } from '@backstage/catalog-model';
import {
  AuthorizeResult,
  PolicyDecision,
} from '@backstage/plugin-permission-common';
import {
  PermissionPolicy,
  PolicyQuery,
  PolicyQueryUser,
} from '@backstage/plugin-permission-node';
import { policyExtensionPoint } from '@backstage/plugin-permission-node/alpha';

type AllowedUsers = {
  name: string;
};

export class AllowAllPermissionPolicy implements PermissionPolicy {
  async handle(
    _request: PolicyQuery,
    _user?: PolicyQueryUser,
  ): Promise<PolicyDecision> {
    return {
      result: AuthorizeResult.ALLOW,
    };
  }
}

type PermissionConfig = {
  plugins: {
    [pluginId: string]: {
      permission?: string[];
      users: AllowedUsers[];
    };
  };
  admins: AllowedUsers[];
};

class CustomPermissionPolicy implements PermissionPolicy {
  private readonly workstreamPolicy: WorkstreamPolicy;
  private CACHE_KEY = 'backstage:rbac:admins';

  constructor(
    private config: PermissionConfig,
    private auth: AuthService,
    private catalogApi: CatalogApi,
    private cache: CacheService,
  ) {
    this.workstreamPolicy = new WorkstreamPolicy(
      config.plugins,
      auth,
      catalogApi,
      cache,
    );
  }

  async handle(
    request: PolicyQuery,
    user: PolicyQueryUser,
  ): Promise<PolicyDecision> {
    // Check if users are available in cache
    if (!(await this.cache.get<AllowedUsers[]>(this.CACHE_KEY))) {
      const allowedUsers: AllowedUsers[] = [];
      for (const admin of this.config.admins) {
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

    const admins = await this.cache.get<AllowedUsers[]>(this.CACHE_KEY);
    if (admins?.some(p => p.name === user.info.userEntityRef)) {
      return { result: AuthorizeResult.ALLOW };
    }

    if (isWorkstreamPermission(request.permission)) {
      return await this.workstreamPolicy.handle(request, user);
    }

    return { result: AuthorizeResult.ALLOW };
  }
}

const createPermissionsModule = createBackendModule({
  pluginId: 'permission',
  moduleId: 'backstage-permission-module',
  register(reg) {
    reg.registerInit({
      deps: {
        policy: policyExtensionPoint,
        config: coreServices.rootConfig,
        discoveryApi: coreServices.discovery,
        auth: coreServices.auth,
        cache: coreServices.cache,
      },
      async init({ policy, config, discoveryApi, auth, cache }) {
        const catalogApi = new CatalogClient({ discoveryApi });

        const permissionConfig =
          config.get<PermissionConfig>('permission.rbac');

        policy.setPolicy(
          new CustomPermissionPolicy(permissionConfig, auth, catalogApi, cache),
        );
      },
    });
  },
});

export default createPermissionsModule;
