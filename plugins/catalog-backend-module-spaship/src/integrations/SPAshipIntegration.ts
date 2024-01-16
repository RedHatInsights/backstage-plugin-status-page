import { Config } from '@backstage/config';
import {
  SPAshipIntegrationConfig,
  readSPAshipIntegrationConfigs,
} from '../lib';

export class SPAshipIntegration {
  static fromConfig(config: Config) {
    const configs = readSPAshipIntegrationConfigs(
      config.getOptionalConfigArray('integrations.spaship') ?? [],
    );
    return new SPAshipIntegration(configs);
  }

  private constructor(private readonly configs: SPAshipIntegrationConfig[]) {}

  list(): SPAshipIntegrationConfig[] {
    return this.configs;
  }

  byUrl(url: string | URL): SPAshipIntegrationConfig | undefined {
    try {
      const parsed = typeof url === 'string' ? new URL(url) : url;
      return this.configs.find(i => this.getHost(i) === parsed.host);
    } catch {
      return undefined;
    }
  }

  byHost(host: string): SPAshipIntegrationConfig | undefined {
    return this.configs.find(i => this.getHost(i) === host);
  }

  private getHost(config: SPAshipIntegrationConfig): string | undefined {
    return config.host;
  }
}
