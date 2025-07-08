import { Config } from '@backstage/config';
import { readSchedulerServiceTaskScheduleDefinitionFromConfig } from '@backstage/backend-plugin-api';
import { EntityOverrides, MCPRegistryProviderConfig } from '../types';

/**
 * Reads the MCP Registry provider configuration from the Backstage config.
 *
 * @param id - Unique identifier for the MCP Registry provider.
 * @param config - The configuration object for the MCP Registry provider.
 * @returns An object containing the MCP Registry provider configuration.
 */
const readMCPRegistryConfig = (
  id: string,
  config: Config,
): MCPRegistryProviderConfig => {
  const host = config.getString('host');
  const apiBaseUrl = config.getString('apiBaseUrl');
  const headers = config.getOptional<Record<string, string>>('headers') ?? {};
  const overrides = config.getOptional<EntityOverrides>('overrides');
  
  const schedule = config.has('schedule')
    ? readSchedulerServiceTaskScheduleDefinitionFromConfig(config.getConfig('schedule'))
    : undefined;

  return {
    id,
    host,
    apiBaseUrl,
    headers,
    overrides,
    schedule,
  };
};

/**
 * Reads all MCP Registry provider configurations from the Backstage config.
 * 
 * @param config - The Backstage configuration object.
 * @returns An array of MCPRegistryProviderConfig objects, each representing a configured MCP Registry provider.
 */
export const readProviderConfigs = (
  config: Config,
): MCPRegistryProviderConfig[] => {
  const configs = config.getOptionalConfigArray('catalog.providers.mcp');
  if (!configs) {
    return [];
  }

  return configs.map((cfg, index) => {
    const id = `registry-${index}`;
    return readMCPRegistryConfig(id, cfg);
  });
};
