import {
  Entity,
  entityKindSchemaValidator,
  KindValidator,
} from '@backstage/catalog-model';

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
