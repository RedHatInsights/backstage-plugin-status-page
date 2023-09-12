import { Entity } from '@backstage/catalog-model';
import { EntityWithContacts } from '../types';

/** @public */
export const isContactDetailsAvailable = (entity: Entity) =>
  Boolean(entity?.spec?.contacts && (entity.spec.contacts as string[]).length > 0);

/** @public */
export const getContactsFromEntity = (entity: EntityWithContacts) =>
  entity?.spec?.contacts ?? [];
