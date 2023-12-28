import { readTaskScheduleDefinitionFromConfig } from '@backstage/backend-tasks';
import { Config } from '@backstage/config';
import {
  CMDBDiscoveryEntityProviderConfig,
  SNowIntegrationConfig,
} from './types';
import { EntityOverride } from '.';

const readCMDBConfig = (
  id: string,
  config: Config,
): CMDBDiscoveryEntityProviderConfig => {
  const host = config.getString('host');
  const sysparmQuery = config.getString('sysparmQuery');
  const querySize = config.getOptionalNumber('querySize');
  const overrides = config.getOptional<EntityOverride>('overrides');
  const customMappings = config.getOptional<Record<string, string>>('customMappings') ?? {};
  const additionalQueryFields = config.getOptionalStringArray('additionalQueryFields');

  const schedule = config.has('schedule')
    ? readTaskScheduleDefinitionFromConfig(config.getConfig('schedule'))
    : undefined;

  return {
    id,
    host,
    querySize,
    sysparmQuery,
    overrides,
    customMappings,
    additionalQueryFields,
    schedule,
  };
};

export const readProviderConfigs = (
  config: Config,
): CMDBDiscoveryEntityProviderConfig[] => {
  const configs = config.getOptionalConfig('catalog.providers.cmdb');
  if (!configs) {
    return [];
  }

  return configs.keys().map(id => {
    return readCMDBConfig(id, configs.getConfig(id));
  });
};

export const readSNowIntegrationConfig = (
  config: Config,
): SNowIntegrationConfig => {
  if (!config) {
    return {};
  }

  if (
    !config.has('host') &&
    !config.has('credentials.username') &&
    !config.has('credentials.password')
  ) {
    return {};
  }

  const host = config.getString('host');
  const apiBaseUrl = config.getString('apiBaseUrl');
  const username = config.getString('credentials.username');
  const password = config.getString('credentials.password');

  return {
    host,
    apiBaseUrl,
    credentials: {
      username,
      password,
    },
  };
};

export const readSNowIntegrationConfigs = (
  configs: Config[],
): SNowIntegrationConfig[] => {
  return configs.map(readSNowIntegrationConfig);
};
