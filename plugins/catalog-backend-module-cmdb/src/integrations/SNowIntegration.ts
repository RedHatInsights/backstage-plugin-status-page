import { readSNowIntegrationConfigs } from '../lib/config';
import { Config } from '@backstage/config';
import { SNowIntegrationConfig } from '../lib';

export class SNowIntegration {
  private readonly configs: SNowIntegrationConfig[];

  static fromConfig(config: Config) {
    const configs = readSNowIntegrationConfigs(
      config.getOptionalConfigArray('integrations.servicenow') ?? [],
    );
    return new SNowIntegration(configs);
  }

  private constructor(configs: SNowIntegrationConfig[]) {
    this.configs = configs;
  }

  list(): SNowIntegrationConfig[] {
    return this.configs;
  }

  byUrl(url: string | URL): SNowIntegrationConfig | undefined {
    try {
      const parsed = typeof url === 'string' ? new URL(url) : url;
      return this.configs.find(i => this.getHost(i) === parsed.host);
    } catch {
      return undefined;
    }
  }

  byHost(host: string): SNowIntegrationConfig | undefined {
    return this.configs.find(i => this.getHost(i) === host);
  }

  private getHost(config: SNowIntegrationConfig): string | undefined {
    return config.host;
  }
}
