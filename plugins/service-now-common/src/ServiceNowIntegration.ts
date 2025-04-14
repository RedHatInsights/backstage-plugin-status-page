import { Config } from '@backstage/config';
import {
  readServiceNowIntegrationConfig,
  ServiceNowIntegrationConfig
} from './lib';

export class ServiceNowIntegration {
  private readonly config: ServiceNowIntegrationConfig;

  static fromConfig(config: Config): ServiceNowIntegration {
    const snConfig = config.getOptionalConfig('servicenow');

    if (!snConfig) {
      throw new Error("Missing 'servicenow' config block");
    }

    const parsed = readServiceNowIntegrationConfig(snConfig);
    return new ServiceNowIntegration(parsed);
  }

  private constructor(config: ServiceNowIntegrationConfig) {
    this.config = config;
  }

  get(): ServiceNowIntegrationConfig {
    return this.config;
  }

  byUrl(url: string | URL): ServiceNowIntegrationConfig | undefined {
    try {
      const parsed = typeof url === 'string' ? new URL(url) : url;
      return this.getHost(this.config) === parsed.host ? this.config : undefined;
    } catch {
      return undefined;
    }
  }

  byHost(host: string): ServiceNowIntegrationConfig | undefined {
    return this.getHost(this.config) === host ? this.config : undefined;
  }

  private getHost(config: ServiceNowIntegrationConfig): string | undefined {
    return config.host;
  }
}
