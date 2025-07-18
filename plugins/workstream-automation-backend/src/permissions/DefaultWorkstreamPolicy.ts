import {
  AuthService,
  SchedulerServiceTaskRunner,
} from '@backstage/backend-plugin-api';
import { GroupEntity, parseEntityRef } from '@backstage/catalog-model';
import { CatalogService } from '@backstage/plugin-catalog-node';
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
  RESOURCE_TYPE_ART_ENTITY,
  RESOURCE_TYPE_USER_REF,
  RESOURCE_TYPE_WORKSTREAM_ENTITY,
  workstreamPluginPermissions,
} from '@compass/backstage-plugin-workstream-automation-common';
import {
  artConditions,
  createArtConditionalDecision,
  createUserNoteConditionalDecision,
  createWorkstreamConditionalDecision,
  userNoteConditions,
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
  Object.values(workstreamPluginPermissions).some(workstreamPermission =>
    isPermission(permission, workstreamPermission),
  );

export type RbacGroupEntity = GroupEntity & {
  spec: GroupEntity['spec'] & {
    permissions: string[];
    members: string[];
  };
};

export class WorkstreamPolicy implements PermissionPolicy {
  private readonly registeredPermissions: string[];
  private readonly configUsers: AllowedUsers[];

  private allowedUsers: AllowedUsers[] = [];

  constructor(
    pluginConfig: PluginPermissionConfig,
    auth: AuthService,
    catalogService: CatalogService,
    taskRunner: SchedulerServiceTaskRunner,
  ) {
    this.registeredPermissions = pluginConfig.workstream.permission ?? [];
    this.configUsers = pluginConfig.workstream.users ?? [];

    taskRunner.run({
      id: 'workstream-policy-refresh',
      fn: async () => {
        await this.refreshAndGetUsers(auth, catalogService);
      },
    });
  }

  private async refreshAndGetUsers(
    auth: AuthService,
    catalogService: CatalogService,
  ) {
    for (const user of this.configUsers) {
      const parsedEntity = parseEntityRef(user.name);
      if (parsedEntity.kind === 'group' && parsedEntity.namespace === 'rbac') {
        const catalogServiceCredentials = {
          credentials: await auth.getOwnServiceCredentials(),
        };
        const rbacGroup = (await catalogService.getEntityByRef(
          user.name,
          catalogServiceCredentials,
        )) as RbacGroupEntity | undefined;
        if (rbacGroup) {
          // Assign rbac group permissions to members
          rbacGroup.spec.members.forEach(member =>
            mergeUser(this.allowedUsers, {
              name: member,
              permission: rbacGroup.spec.permissions,
            }),
          );
          // Assign rbac group permissions to children groups
          rbacGroup.spec.children.forEach(children => {
            mergeUser(this.allowedUsers, {
              name: children,
              permission: rbacGroup.spec.permissions,
            });
          });
        }
      } else {
        mergeUser(this.allowedUsers, {
          name: user.name,
          permission: [...(user.permission ?? this.registeredPermissions)],
        });
      }
    }
  }

  async handle(
    request: PolicyQuery,
    user: PolicyQueryUser,
  ): Promise<PolicyDecision> {
    if (!this.registeredPermissions.includes(request.permission.name)) {
      return { result: AuthorizeResult.DENY };
    }

    for (const entityRef of user.info.ownershipEntityRefs) {
      const userFound = this.allowedUsers.find(p => p.name === entityRef);
      if (
        userFound &&
        userFound.permission?.includes(request.permission.name)
      ) {
        return { result: AuthorizeResult.ALLOW };
      }
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

    if (isResourcePermission(request.permission, RESOURCE_TYPE_ART_ENTITY)) {
      return createArtConditionalDecision(
        request.permission,
        artConditions.isArtOwner({ claim: user.info.userEntityRef ?? '' }),
      );
    }

    if (isResourcePermission(request.permission, RESOURCE_TYPE_USER_REF)) {
      return createUserNoteConditionalDecision(
        request.permission,
        userNoteConditions.isValidUser({
          claim: user.info.userEntityRef ?? '',
        }),
      );
    }

    return { result: AuthorizeResult.DENY };
  }
}

export function mergeUser(users: AllowedUsers[], newUser: AllowedUsers) {
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
