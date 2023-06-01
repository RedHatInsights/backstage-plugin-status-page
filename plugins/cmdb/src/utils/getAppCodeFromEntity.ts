import { Entity } from '@backstage/catalog-model';

/** @public */
export const APP_CODE_ANNOTATION = 'service-now.com/appcode';

/** @public */
export const isAppCodeAvailable = (entity: Entity) =>
  Boolean(entity?.metadata.annotations?.[APP_CODE_ANNOTATION]);

export const getAppCodeFromEntity = (entity: Entity) =>
  entity?.metadata.annotations?.[APP_CODE_ANNOTATION] ?? '';
