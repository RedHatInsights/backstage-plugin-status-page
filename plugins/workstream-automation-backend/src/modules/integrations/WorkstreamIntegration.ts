import { RootConfigService } from '@backstage/backend-plugin-api';
import { Config } from '@backstage/config';
import { DEFAULT_WORKSTREAM_NAMESPACE } from '../lib/constants';

export type WorkstreamIntegrationConfig = {
  host: string;
  apiBaseUrl: string;
  token: string;
  config: {
    namespace: string;
  };
};

function readWorkstreamIntegrationConfig(
  config?: Config[],
): WorkstreamIntegrationConfig[] {
  if (config) {
    const wIConfig: WorkstreamIntegrationConfig[] = config.map(data => ({
      host: data.getString('host'),
      apiBaseUrl: data.getString('apiBaseUrl'),
      token: data.getString('token'),
      config: {
        namespace:
          data.getOptionalString('config.namespace') ??
          DEFAULT_WORKSTREAM_NAMESPACE,
      },
    }));
    return wIConfig;
  }
  return [];
}

export class WorkstreamIntegration {
  constructor(private configs: WorkstreamIntegrationConfig[]) {}

  static fromConfig(config: RootConfigService): WorkstreamIntegration {
    const configs = readWorkstreamIntegrationConfig(
      config.getOptionalConfigArray('integrations.workstreams') ?? [],
    );

    return new WorkstreamIntegration(configs);
  }
  list(): WorkstreamIntegrationConfig[] {
    return this.configs;
  }

  byUrl(url: string): WorkstreamIntegrationConfig | undefined {
    try {
      const parsed = typeof url === 'string' ? new URL(url) : url;
      return this.configs.find(i => this.getHost(i) === parsed.host);
    } catch {
      return undefined;
    }
  }

  byHost(host: string): WorkstreamIntegrationConfig | undefined {
    return this.configs.find(i => this.getHost(i) === host);
  }

  private getHost(config: WorkstreamIntegrationConfig): string | undefined {
    const [host, _port] = config.host.split(':');
    return host;
  }
}
