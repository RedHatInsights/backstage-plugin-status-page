import { Entity } from '@backstage/catalog-model';

export const mockEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'System',
  metadata: {
    name: 'example-application',
  },
  spec: {
    contacts: [
      {
        label: 'Manager',
        users: ['user:default/user1'],
      },
      {
        label: 'Team',
        group: 'group:default/mock-group',
      },
      {
        label: 'QEs',
        group: 'group:default/mock-group-qes',
      },
      {
        label: 'Escalation',
        users: [
          'user:default/user3',
          'user:default/user2',
          'user:default/user1',
        ],
      },
    ],
  },
};
