import {
  LoggerService,
  SchedulerService,
  SchedulerServiceTaskRunner,
} from '@backstage/backend-plugin-api';
import { ANNOTATION_LOCATION, Entity } from '@backstage/catalog-model';
import { Config } from '@backstage/config';
import {
  DeferredEntity,
  EntityProvider,
  EntityProviderConnection,
} from '@backstage/plugin-catalog-node';
import * as uuid from 'uuid';
import { MCPRegistryClient, paginated } from './lib/client';
import { readProviderConfigs } from './lib/config';
import { MCPRegistryProviderConfig, MCPRegistryServer } from './types';
import { transform } from './lib/transform';

export class MCPRegistryProvider implements EntityProvider {
  private readonly provider: MCPRegistryProviderConfig;
  private readonly logger: LoggerService;
  private connection?: EntityProviderConnection;
  private scheduleFn?: () => Promise<void>;

  static fromConfig(
    config: Config,
    options: {
      logger: LoggerService;
      schedule?: SchedulerServiceTaskRunner;
      scheduler?: SchedulerService;
    },
  ): MCPRegistryProvider[] {
    if (!options.schedule && !options.scheduler) {
      throw new Error('Either schedule or scheduler must be provided.');
    }

    const providerConfigs = readProviderConfigs(config);

    return providerConfigs.map(providerConfig => {
      if (!options.schedule && !providerConfig.schedule) {
        throw new Error(
          `No schedule provided neither via code nor config for MCPRegistryProvider:${providerConfig.id}.`,
        );
      }

      const taskRunner =
        options.schedule ??
        options.scheduler!.createScheduledTaskRunner(providerConfig.schedule!);

      const provider = new MCPRegistryProvider({
        ...options,
        provider: providerConfig,
        taskRunner,
      });

      provider.schedule(taskRunner);

      return provider;
    });
  }

  private constructor(options: {
    provider: MCPRegistryProviderConfig;
    logger: LoggerService;
    taskRunner: SchedulerServiceTaskRunner;
  }) {
    this.provider = options.provider;
    this.logger = options.logger.child({
      target: this.getProviderName(),
    });
  }

  getProviderName(): string {
    return `MCPServerProvider:${this.provider.id}`;
  }

  async connect(connection: EntityProviderConnection): Promise<void> {
    this.connection = connection;
    await this.scheduleFn?.();
  }

  async read(logger: LoggerService) {
    if (!this.connection) {
      throw new Error(
        `MCP Registry discovery connection not initialized for ${this.getProviderName()}`,
      );
    }

    const { markReadComplete } = trackProgress(logger);

    const client = new MCPRegistryClient({
      config: this.provider,
      logger: this.logger,
    });

    const servers = paginated(params => client.listServers(params), {});

    const res = {
      scanned: 0,
      matches: [] as MCPRegistryServer[],
    };

    for await (const server of servers) {
      res.scanned++;

      res.matches.push(server);
    }

    const { markCommitComplete } = markReadComplete({
      servers: res.matches,
    });

    const entities = res.matches.map(p => transform(p, this.provider));

    await this.connection.applyMutation({
      type: 'full',
      entities: [...entities].map(entity => withLocations(entity)),
    });

    markCommitComplete();
  }

  schedule(taskRunner: SchedulerServiceTaskRunner) {
    this.scheduleFn = async () => {
      const taskId = `${this.getProviderName()}:refresh`;
      return taskRunner.run({
        id: taskId,
        fn: async () => {
          const logger = this.logger.child({
            class: MCPRegistryProvider.prototype.constructor.name,
            taskId,
            taskInstanceId: uuid.v4(),
          });

          try {
            await this.read(logger);
          } catch (error: any) {
            logger.error(
              `${this.getProviderName()} refresh failed, ${error}`,
              error,
            );
          }
        },
      });
    };
  }
}

function trackProgress(logger: LoggerService) {
  let timestamp = Date.now();
  let summary: string;

  function markReadComplete(read: { servers: MCPRegistryServer[] }) {
    summary = `${read.servers.length} servers`;
    const readDuration = ((Date.now() - timestamp) / 1000).toFixed(1);
    timestamp = Date.now();
    logger.info(`Read ${summary} in ${readDuration} seconds. Committing...`);
    return { markCommitComplete };
  }

  function markCommitComplete() {
    const commitDuration = ((Date.now() - timestamp) / 1000).toFixed(1);
    logger.info(`Committed ${summary} in ${commitDuration} seconds.`);
  }

  return { markReadComplete };
}

function withLocations(entity: Entity): DeferredEntity {
  return {
    locationKey: entity.metadata.annotations?.[ANNOTATION_LOCATION],
    entity,
  };
}
