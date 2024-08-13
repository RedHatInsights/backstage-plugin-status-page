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
  constructor(
    private workstreamAllowedUsers: AllowedUsers[] = [],
    private registeredPermissions: string[] = [],
  ) {}

  static fromConfig(config: PluginPermissionConfig) {
    const workstreamAllowedUsers = config.workstream.users;
    const registeredPermissions = config.workstream.permission;
    return new WorkstreamPolicy(workstreamAllowedUsers, registeredPermissions);
  }

  async handle(
    request: PolicyQuery,
    user?: PolicyQueryUser,
  ): Promise<PolicyDecision> {
    if (this.registeredPermissions.includes(request.permission.name)) {
      if (
        this.workstreamAllowedUsers.find(val =>
          user?.info.ownershipEntityRefs.includes(val.name),
        )
      ) {
        return { result: AuthorizeResult.ALLOW };
      }
      if (
        isResourcePermission(
          request.permission,
          RESOURCE_TYPE_WORKSTREAM_ENTITY,
        )
      ) {
        return createWorkstreamConditionalDecision(
          request.permission,
          workstreamConditions.isWorkstreamLead({
            claim: user?.info.userEntityRef ?? '',
          }),
        );
      }
    }
    return { result: AuthorizeResult.DENY };
  }
}
