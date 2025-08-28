import { Entity } from '@backstage/catalog-model';

export const mockEntityWithoutXeaixway: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'no-xeaixway',
    namespace: 'default',
    description: 'A test component without XE AI Expressway data',
  },
  spec: {
    type: 'service',
    lifecycle: 'production',
  },
};

export const mockEntityWithXeaixway: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'with-xeaixway',
    namespace: 'default',
    description: 'A test component with XE AI Expressway data',
    xeaixway: {
      id: 'XEAIXWAY-95',
      summary: 'Implement AI-powered feature detection system',
      phase: 'ALPHA',
      status: 'In Progress',
      owner: 'John Doe',
      ownerEmail: 'john.doe@example.com',
      assignee: 'Jane Smith',
      tags: ['machine-learning', 'computer-vision', 'backend'],
    } as any,
  },
  spec: {
    type: 'service',
    lifecycle: 'development',
  },
};

export const mockEntityWithMinimalXeaixway: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'minimal-xeaixway',
    namespace: 'default',
    description: 'A test component with minimal XE AI Expressway data',
    xeaixway: {
      id: 'XEAIXWAY-96',
      summary: 'Basic AI integration',
    } as any,
  },
  spec: {
    type: 'library',
    lifecycle: 'experimental',
  },
};


