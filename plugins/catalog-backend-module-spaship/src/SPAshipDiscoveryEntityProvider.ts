import {
  DeferredEntity,
  EntityProvider,
  EntityProviderConnection,
} from '@backstage/plugin-catalog-node';
import {
  SPAship,
  SPAshipClient,
  SPAshipDiscoveryEntityProviderConfig,
  SPAshipIntegrationConfig,
  generateComponentEntity,
  generateSystemEntity,
  readProviderConfigs,
} from './lib';
import {
  SchedulerService as PluginTaskScheduler,
  SchedulerServiceTaskRunner as TaskRunner,
} from '@backstage/backend-plugin-api';
import * as uuid from 'uuid';
import {
  ANNOTATION_LOCATION,
  Entity,
  stringifyEntityRef,
} from '@backstage/catalog-model';
import { Config } from '@backstage/config';
import { SPAshipIntegration } from './integrations';
import { isEmpty } from 'lodash';
import { LoggerService } from '@backstage/backend-plugin-api';

export class SPAshipDiscoveryEntityProvider implements EntityProvider {
  private readonly provider: SPAshipDiscoveryEntityProviderConfig;
  private readonly integration: SPAshipIntegrationConfig;
  private readonly logger: LoggerService;
  private connection?: EntityProviderConnection;
  scheduleFn?: () => Promise<void>;

  static fromConfig(
    config: Config,
    options: {
      logger: LoggerService;
      schedule?: TaskRunner;
      scheduler?: PluginTaskScheduler;
    },
  ): SPAshipDiscoveryEntityProvider[] {
    if (!options.schedule && !options.scheduler) {
      throw new Error('Either schedule or shceduler must be provided.');
    }

    const providerConfigs = readProviderConfigs(config);
    const integrations = SPAshipIntegration.fromConfig(config);

    return providerConfigs.map(providerConfig => {
      const integration = integrations.byHost(providerConfig.host);

      if (!integration) {
        throw new Error(
          `No SPAship integration found that matches host ${providerConfig.host}`,
        );
      }

      if (!options.schedule && !providerConfig.schedule) {
        throw new Error(
          `No schedule provided neither via code nor config for SPAshipDiscoveryEntityProvider:${providerConfig.id}`,
        );
      }

      const taskRunner =
        options.schedule ??
        options.scheduler!.createScheduledTaskRunner(providerConfig.schedule!);

      const provider = new SPAshipDiscoveryEntityProvider({
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
    provider: SPAshipDiscoveryEntityProviderConfig;
    integration: SPAshipIntegrationConfig;
    logger: LoggerService;
    taskRunner: TaskRunner;
  }) {
    this.provider = options.provider;
    this.integration = options.integration;
    this.logger = options.logger.child({
      target: this.getProviderName(),
    });
  }

  getProviderName(): string {
    return `SPAshipDiscoveryEntityProvider:${this.provider.id}`;
  }
  async connect(connection: EntityProviderConnection): Promise<void> {
    this.connection = connection;
    await this.scheduleFn?.();
  }

  async read(logger: LoggerService): Promise<void> {
    if (!this.connection) {
      throw new Error(
        `SPAship discovery connection not initialized for ${this.getProviderName()}`,
      );
    }

    const { markReadComplete } = trackProgress(logger);

    const client = new SPAshipClient({
      config: this.integration,
      logger,
    });

    const res = {
      propertiesScanned: 0,
      applicationsScanned: 0,
      groupedProperties: [] as Array<{
        property: SPAship.Property;
        applications: SPAship.Application[];
      }>,
    };

    const properties = await client.getProperties();

    /* Using for await loop here to ensure the following statements inside the loop are executed synchronously */
    for await (const property of properties) {
      if (!property.identifier) {
        continue;
      }
      /**
       * If the "properties" array is defined in the provider config,
       * and the `property` does is not present in the array, then skip the property.
       *
       * Also, if the property is in the exludeProperties array defined in the provider config, then skip the property
       */
      if (
        (!isEmpty(this.provider.properties) &&
          !this.provider.properties?.includes(property.identifier)) ||
        this.provider.excludeProperties?.includes(property.identifier)
      ) {
        continue;
      }

      res.propertiesScanned++;

      const applications = await client.getApplications(property.identifier);
      const uniqueApps = applications.filter(app => Boolean(app.identifier));

      res.applicationsScanned += uniqueApps.length;

      res.groupedProperties.push({
        property,
        applications: uniqueApps,
      });
    }

    const { markCommitComplete } = markReadComplete({
      propertiesCount: res.propertiesScanned,
      applicationsCount: res.applicationsScanned,
    });

    const entities: Entity[] = res.groupedProperties.reduce(
      (acc, { property, applications }) => {
        const system = generateSystemEntity(property, this.provider, logger);

        acc.push(system);

        applications.forEach(application => {
          const isProduction =
            application.environments.findIndex(e => e.env === 'prod') !== -1;

          const component = generateComponentEntity(
            application,
            this.provider,
            {
              cmdbCode: property.cmdbCode,
              systemRef: stringifyEntityRef(system),
              lifecycle: isProduction ? 'production' : 'preproduction',
            },
            logger,
          );

          acc.push(component);
        });

        return acc;
      },
      [] as Entity[],
    );

    await this.connection.applyMutation({
      type: 'full',
      entities: [...entities].map(withLocations),
    });

    markCommitComplete();
  }

  schedule(taskRunner: TaskRunner) {
    this.scheduleFn = async () => {
      const taskId = `${this.getProviderName()}:refresh`;
      return taskRunner.run({
        id: taskId,
        fn: async () => {
          const logger = this.logger.child({
            class: SPAshipDiscoveryEntityProvider.prototype.constructor.name,
            taskId,
            taskInstanceId: uuid.v4(),
          });

          try {
            await this.read(logger);
          } catch (error) {
            logger.error(
              `${this.getProviderName()} refresh failed, ${error}`,
              error ?? {},
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

  function markReadComplete(read: {
    propertiesCount: number;
    applicationsCount: number;
  }) {
    summary = `${read.propertiesCount} Properties and ${read.applicationsCount} Applications`;
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
