import { Entity } from "@backstage/catalog-model";

export const mockGroup1: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Group',
  metadata: {
    name: 'mock-group',
    namespace: 'examples'
  },
  spec: {
    type: 'team',
    members: [
      'user:default/user1',
      'user:default/user2',
      'user:default/user3',
    ]
  }
}

export const mockGroup2: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Group',
  metadata: {
    name: 'mock-group-qes',
    namespace: 'examples'
  },
  spec: {
    type: 'team',
    members: [
      'user:default/user1',
      'user:default/user2',
      'user:default/user3',
      'user:default/user4',
      'user:default/user5',
    ]
  }
}
