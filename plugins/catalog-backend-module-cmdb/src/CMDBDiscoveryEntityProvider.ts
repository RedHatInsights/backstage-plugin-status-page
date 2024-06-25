import {
  DeferredEntity,
  EntityProvider,
  EntityProviderConnection,
} from '@backstage/plugin-catalog-node';
import {
  CMDBDiscoveryEntityProviderConfig,
  CMDBRecord,
  DEFAULT_CMDB_QUERY_SIZE,
  SNowClient,
  SNowIntegrationConfig,
  mapper,
  paginated,
  readProviderConfigs,
  transformer,
} from './lib';
import { LoggerService, SchedulerService, SchedulerServiceTaskRunner } from '@backstage/backend-plugin-api';
import { Config } from '@backstage/config';
import { SNowIntegration } from './integrations/SNowIntegration';
import { merge } from 'lodash';
import * as uuid from 'uuid';
import { Entity, ANNOTATION_LOCATION } from '@backstage/catalog-model';

export class CMDBDiscoveryEntityProvider implements EntityProvider {
  private readonly provider: CMDBDiscoveryEntityProviderConfig;
  private readonly integration: SNowIntegrationConfig;
  private readonly logger: LoggerService;
  scheduleFn?: () => Promise<void>;
  private connection?: EntityProviderConnection;

  static fromConfig(
    config: Config,
    options: {
      logger: LoggerService;
      schedule?: SchedulerServiceTaskRunner;
      scheduler?: SchedulerService;
    },
  ): CMDBDiscoveryEntityProvider[] {
    if (!options.schedule && !options.scheduler) {
      throw new Error('Either schedule or scheduler must be provided.');
    }

    const providerConfigs = readProviderConfigs(config);
    const integrations = SNowIntegration.fromConfig(config);

    return providerConfigs.map(providerConfig => {
      const integration = integrations.byHost(providerConfig.host);

      if (!integration) {
        throw new Error(
          `No ServiceNow integration found that matches host ${providerConfig.host}`,
        );
      }

      if (!providerConfig.sysparmQuery) {
        throw new Error(
          `Missing 'sysparmQuery' value for CMDBDiscoveryEntityProvider:${providerConfig.id}.`,
        );
      }

      if (!options.schedule && !providerConfig.schedule) {
        throw new Error(
          `No schedule provided neither via code nor config for CMDBDiscoveryEntityProvider:${providerConfig.id}.`,
        );
      }

      const taskRunner =
        options.schedule ??
        options.scheduler!.createScheduledTaskRunner(providerConfig.schedule!);

      const provider = new CMDBDiscoveryEntityProvider({
        ...options,
        provider: providerConfig,
        integration,
        taskRunner,
      });

      provider.schedule(taskRunner);

      return provider;
    });
  }

  constructor(options: {
    provider: CMDBDiscoveryEntityProviderConfig;
    integration: SNowIntegrationConfig;
    logger: LoggerService;
    taskRunner: SchedulerServiceTaskRunner;
  }) {
    this.provider = options.provider;
    this.integration = options.integration;
    this.logger = options.logger.child({
      target: this.getProviderName(),
    });
  }

  getProviderName(): string {
    return `CMDBDiscoveryEntityProvider:${this.provider.id}`;
  }

  async connect(connection: EntityProviderConnection): Promise<void> {
    this.connection = connection;
    await this.scheduleFn?.();
  }

  async read(logger: LoggerService): Promise<void> {
    if (!this.connection) {
      throw new Error(
        `CMDB discovery connection not initialized for ${this.getProviderName()}`,
      );
    }

    const { markReadComplete } = trackProgress(logger);

    const client = new SNowClient({
      config: this.integration,
      logger,
    });

    const additionalFields = this.provider.additionalQueryFields ?? [];

    const applications = paginated(
      options =>
        client.getBusinessApplications(this.provider.sysparmQuery!, options),
      {
        sysparm_offset: 0,
        sysparm_limit: this.provider.querySize ?? DEFAULT_CMDB_QUERY_SIZE,
        sysparm_fields: additionalFields.join(','),
      },
    );

    const res = {
      scanned: 0,
      matches: [] as CMDBRecord[],
    };

    for await (const application of applications) {
      res.scanned++;

      /* TODO: Check if application is active */
      res.matches.push(application);
    }

    const { markCommitComplete } = markReadComplete({
      applications: res.matches,
    });

    const entities = res.matches.map(p =>
      merge(transformer(p, this.provider), mapper(p, this.provider)),
    );

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
            class: CMDBDiscoveryEntityProvider.prototype.constructor.name,
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

  function markReadComplete(read: { applications: any }) {
    summary = `${read.applications.length} CMDB Applications`;
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
