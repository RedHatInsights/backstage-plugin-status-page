import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { Config } from '@backstage/config';
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
  WorkstreamPolicy,
  isWorkstreamPermission,
} from '@appdev-platform/backstage-plugin-workstream-automation-backend';

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

  constructor(private config: PermissionConfig) {
    this.workstreamPolicy = WorkstreamPolicy.fromConfig(this.config.plugins);
  }

  static fromConfig(config: Config) {
    const permissionConfig = config.get<PermissionConfig>('permission.rbac');
    return new CustomPermissionPolicy(permissionConfig);
  }

  async handle(
    request: PolicyQuery,
    user?: PolicyQueryUser,
  ): Promise<PolicyDecision> {
    for (const admin of this.config.admins) {
      if (user?.info.ownershipEntityRefs.includes(admin.name))
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
  moduleId: 'workstream-policy',
  register(reg) {
    reg.registerInit({
      deps: { policy: policyExtensionPoint, config: coreServices.rootConfig },
      async init({ policy, config }) {
        policy.setPolicy(CustomPermissionPolicy.fromConfig(config));
      },
    });
  },
});

export default createPermissionsModule;
