import {
  Entity,
  entityKindSchemaValidator,
  KindValidator,
} from '@backstage/catalog-model';
import {
  Datasource,
  DatasourceEntity,
} from '@compass/backstage-plugin-datasource-common';

export function ajvCompiledJsonSchemaValidator(schema: unknown): KindValidator {
  let validator: undefined | ((data: unknown) => any);
  return {
    async check(data) {
      if (!validator) {
        validator = entityKindSchemaValidator(schema);
      }
      return validator(data) === data;
    },
  };
}

export const isAiDatasourceEntity = (entity: Entity) =>
  entity.kind === 'Resource' &&
  entity.apiVersion === 'resource/v1alpha1' &&
  entity.metadata.annotations &&
  entity.metadata.annotations['compass.redhat.com/ai-related'] === 'true';

export const mapDatasourceToResourceEntity = (
  data: Datasource,
): DatasourceEntity => {
  return {
    apiVersion: 'resource/v1alpha1',
    kind: 'Resource',
    metadata: {
      name: data.name,
      title: data.title,
      description: data.description,
      namespace: data.namespace,
      annotations: {
        'compass.redhat.com/ai-related': data.aiRelated,
        ...(data.cmdbAppCode
          ? { 'servicenow.com/appcode': data.cmdbAppCode }
          : {}),
      },
      datasourceId: data.id,
      tags: data.tags,
    },
    spec: {
      classification: data.classification,
      existsIn: data.existsIn.map(e => ({
        ...e,
      })),
      location: data.location,
      owner: data.owner,
      steward: data.steward,
      type: data.type,
      usage: data.usage,
      dependencyOf: data.dependencyOf,
      dependsOn: data.dependsOn,
      ...(data.system ? { system: data.system } : {}),
    },
  };
};
