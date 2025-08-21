import {
  AuthService,
  coreServices,
  createBackendModule,
  SchedulerServiceTaskRunner,
} from '@backstage/backend-plugin-api';
import {
  CatalogService,
  catalogServiceRef,
} from '@backstage/plugin-catalog-node';
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
import {
  isWorkstreamPermission,
  WorkstreamPolicy,
} from '@compass/backstage-plugin-workstream-automation-backend';

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

  constructor(
    private config: PermissionConfig,
    auth: AuthService,
    catalog: CatalogService,
    taskRunner: SchedulerServiceTaskRunner,
  ) {
    this.workstreamPolicy = new WorkstreamPolicy(
      config.plugins,
      auth,
      catalog,
      taskRunner,
    );
  }

  async handle(
    request: PolicyQuery,
    user: PolicyQueryUser,
  ): Promise<PolicyDecision> {
    if (
      this.config.admins?.some(p =>
        user.info.ownershipEntityRefs.includes(p.name),
      )
    ) {
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
        schdeuler: coreServices.scheduler,
        catalog: catalogServiceRef,
        database: coreServices.database,
      },
      async init({ policy, config, auth, schdeuler, catalog }) {
        const permissionConfig =
          config.getOptional<PermissionConfig>('permission.rbac');

        if (permissionConfig) {
          const taskRunner = schdeuler.createScheduledTaskRunner({
            frequency: { hours: 3 },
            timeout: { minutes: 15 },
            initialDelay: { minutes: 3 },
            scope: 'local',
          });
          policy.setPolicy(
            new CustomPermissionPolicy(
              permissionConfig,
              auth,
              catalog,
              taskRunner,
            ),
          );
        }
      },
    });
  },
});

export default createPermissionsModule;
