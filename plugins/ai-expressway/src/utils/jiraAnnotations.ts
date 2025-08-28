import { Entity } from '@backstage/catalog-model';

export const XEAIXWAY_INITIATIVE_ANNOTATION = 'xeaixway/initiative' as const;

export const isXEAIXWayAvailable = (entity: Entity): boolean => {
  return Boolean(entity?.metadata?.annotations?.[XEAIXWAY_INITIATIVE_ANNOTATION]);
};
