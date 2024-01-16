import { Config } from '@backstage/config';
import {
  EntityOverride,
  SPAshipDiscoveryEntityProviderConfig,
  SPAshipIntegrationConfig,
} from './types';
import { readTaskScheduleDefinitionFromConfig } from '@backstage/backend-tasks';

const readSPAshipConfig = (
  id: string,
  config: Config,
): SPAshipDiscoveryEntityProviderConfig => {
  const host = config.getString('host');
  const defaultOwnerNamespace = config.getOptionalString('defaultOwnerNamespace');
  const excludeProperties = config.getOptionalStringArray('excludeProperties');
  const customPropertyMappings =
    config.getOptional<Record<string, string>>('customPropertyMappings');
  const customApplicationMappings =
    config.getOptional<Record<string, string>>('customApplicationMappings');
  const overrides = config.getOptional<EntityOverride>('overrides');

  const schedule = config.has('schedule')
    ? readTaskScheduleDefinitionFromConfig(config.getConfig('schedule'))
    : undefined;

  return {
    id,
    host,
    defaultOwnerNamespace,
    excludeProperties,
    customPropertyMappings,
    customApplicationMappings,
    overrides,
    schedule,
  };
};

export const readProviderConfigs = (
  config: Config,
): SPAshipDiscoveryEntityProviderConfig[] => {
  const configs = config.getOptionalConfig('catalog.providers.spaship');
  if (!configs) {
    return [];
  }

  return configs.keys().map(id => {
    return readSPAshipConfig(id, configs.getConfig(id));
  });
};

export const readSPAshipIntegrationConfig = (
  config: Config,
): SPAshipIntegrationConfig => {
  if (!config) {
    return {};
  }

  if (
    !config.has('host') &&
    !config.has('apiBaseUrl') &&
    !config.has('token')
  ) {
    return {};
  }

  const host = config.getString('host');
  const apiBaseUrl = config.getString('apiBaseUrl');
  const apiKey = config.getString('apiKey');

  return {
    host,
    apiBaseUrl,
    apiKey,
  };
};

export const readSPAshipIntegrationConfigs = (
  configs: Config[],
): SPAshipIntegrationConfig[] => {
  return configs.map(readSPAshipIntegrationConfig);
};
