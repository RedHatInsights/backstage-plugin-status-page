import { Config } from '@backstage/config';
import {
  ServiceNowIntegrationConfig,
} from './types';

/**
 * Parses a single ServiceNow integration config block
 */
export const readServiceNowIntegrationConfig = (
  config: Config,
): ServiceNowIntegrationConfig => {
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

/**
 * Parses all ServiceNow integrations from config array.
 */
export const readServiceNowIntegrationConfigs = (
  config: Config,
): ServiceNowIntegrationConfig[] => {
  const serviceNowConfig = config.getOptionalConfigArray('integrations.servicenow');
  if (!serviceNowConfig || serviceNowConfig.length === 0) {
    throw new Error('Missing required config value at integrations.servicenow');
  }
  return serviceNowConfig.map(readServiceNowIntegrationConfig);
};
