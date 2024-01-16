import { Entity } from '@backstage/catalog-model';
import { SPAship } from './types';
import { isEmpty, set } from 'lodash';
import { renderString } from 'nunjucks';

export function mapper<T extends (SPAship.Property | SPAship.Application)>(
  record: T,
  customMappings: Record<string, string> | undefined,
): Partial<Entity> {
  if (isEmpty(customMappings)) {
    return {};
  }

  return Object.keys(customMappings).reduce((acc, key) => {
    const template = customMappings[key];
    set(acc, key, renderString(template, { ...record }));

    return acc;
  }, {});
}
