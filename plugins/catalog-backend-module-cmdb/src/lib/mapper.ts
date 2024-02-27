import { ComponentEntity } from '@backstage/catalog-model';
import { isEmpty, set } from 'lodash';
import { renderString } from 'nunjucks';
import { CMDBDiscoveryEntityProviderConfig, CMDBRecord } from './types';

/**
 * Creates a custom object by picking the fields defined in the provider.map from the application
 *
 * @param application CMDB Record
 * @param provider CMDB Provider
 * @returns Object with properties mapped as defined in the provider.map
 */
export function mapper(
  application: CMDBRecord,
  provider: CMDBDiscoveryEntityProviderConfig,
): Partial<ComponentEntity> {
  const customMappings = provider.customMappings;

  if (isEmpty(customMappings)) {
    return {};
  }

  const flattenedData = Object.keys(application).reduce((acc, k) => {
    acc[k.replace(/\./g, '_')] = application[k];
    return acc;
  }, {} as any);

  const entity = Object.keys(customMappings).reduce((acc, key) => {
    const template = customMappings[key].replace(
      /(\{\{\s*) (\w+)\.(\w+)\s*(\}\})/g,
      '$1 $2_$3 $4',
    );
    const value = renderString(template, { ...flattenedData });
    if (value) {
      set(acc, key, value);
    }

    return acc;
  }, {});

  return entity;
}
