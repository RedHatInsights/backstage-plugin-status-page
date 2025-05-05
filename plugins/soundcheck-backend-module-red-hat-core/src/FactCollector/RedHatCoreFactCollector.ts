'use strict';

import {
  FactCollector,
} from "@spotify/backstage-plugin-soundcheck-node";
import {
  Entity,
  EntityLink,
  stringifyEntityRef,
} from '@backstage/catalog-model';
import {
  CollectionConfig,
  CollectionError,
  Fact,
  FactRef,
  parseFactRef,
} from '@spotify/backstage-plugin-soundcheck-common';
import {
  CacheService,
  LoggerService,
  RootConfigService,
} from "@backstage/backend-plugin-api";
import {
  DateTime,
} from 'luxon';
import {
  Config,
} from "@backstage/config";
import {
  Status,
} from "../types/Status";
import * as chrono from 'chrono-node';
import {
  CmdbTokenConfigurationPairMissingError,
  EntityMissingCmdbAnnotationError,
  EntityMissingProductionLinkError,
  NotOkResponseError,
} from "../errors";
import RedHatCoreDependencyComposerSchema from '../schemas/RedHatCoreDependencyComposer.schema.json';
import RedHatCoreDependencyDrupalSchema from '../schemas/RedHatCoreDependencyDrupal.schema.json';
import RedHatCoreStatusSchema from '../schemas/RedHatCoreStatus.schema.json';

/**
 * Fact collector for the API endpoints for the Red Hat Core module for Drupal.
 */
export class RedHatCoreFactCollector implements FactCollector {

  /** @inheritdoc */
  id: string = 'red-hat-core';

  /** @inheritdoc */
  name: string = 'Red Hat Core';

  /** @inheritdoc */
  description: string = 'Collects facts about Drupal platforms from the Red Hat Core REST API endpoints.';

  /**
   * CMDB app code annotation ID.
   *
   * @type {string}
   *
   * @protected
   *
   * @readonly
   */
  protected readonly annotationAppCmdbCode: string = 'servicenow.com/appcode';

  /**
   * Cache service.
   *
   * @type {CacheService}
   *
   * @protected
   */
  protected cache: CacheService;

  /**
   * Collector configuration.
   *
   * @type {Config | undefined}
   *
   * @protected
   */
  protected collectorConfig: Config | undefined;

  /**
   * Config service.
   *
   * @type {RootConfigService}
   *
   * @protected
   */
  protected config: RootConfigService;

  /**
   * Logger service.
   *
   * @type {LoggerService}
   *
   * @protected
   */
  protected logger: LoggerService;

  /**
   * Platform configuration.
   *
   * @type {Config[]}
   *
   * @protected
   */
  protected platforms: Config[];

  /**
   * Static factory method.
   *
   * @param {CacheService} cache
   *   Cache service.
   * @param {RootConfigService} config
   *   Root configuration service.
   * @param {LoggerService} logger
   *   Logger service.
   *
   * @return {RedHatCoreFactCollector}
   *   Instance of this class.
   */
  public static create(
    cache: CacheService,
    config: RootConfigService,
    logger: LoggerService,
  ): RedHatCoreFactCollector {
    return new this(
      cache,
      config,
      logger,
    );
  }

  /**
   * Constructor.
   *
   * @param {CacheService} cache
   *   Cache service.
   * @param {RootConfigService} config
   *   Config service.
   * @param {LoggerService} logger
   *   Logger service.
   *
   * @protected
   */
  protected constructor(
    cache: CacheService,
    config: RootConfigService,
    logger: LoggerService,
  ) {
    this.cache = cache;
    this.config = config;
    this.logger = logger.child({
      target: 'RedHatCoreFactCollector',
    });

    this.platforms = this.config.getConfigArray('soundcheck.collectors.redHatCore.platforms');

    this.collectorConfig = this.config.getOptionalConfig(
      'soundcheck.collectors.redHatCore',
    );
  }

  /** @inheritdoc */
  async collect(
    entities: Entity[],
    params?: {
      factRefs?: FactRef[];
      refresh?: FactRef[];
    },
  ): Promise<(Fact | CollectionError)[]> {
    const facts: Fact[] = [];

    for (const entity of entities) {
      for (const factRef of params?.factRefs ?? []) {
        const parsedFactRef = parseFactRef(factRef);

        let fact: Fact | undefined;

        fact = undefined;

        try {
          switch (parsedFactRef.name) {
            case 'dependency-composer':
              fact = await this.collectDependencyComposer(
                entity,
                factRef,
              );
              break;

            case 'dependency-drupal':
              fact = await this.collectDependencyDrupal(
                entity,
                factRef,
              );
              break;

            case 'status':
              fact = await this.collectStatus(
                entity,
                factRef,
              );
              break;

            default:
            // Do nothing.
          }
        }
        catch (error: any) {
          this.logger.info(error);
        }

        if (fact !== undefined) {
          facts.push(fact);
        }
      }
    }

    return facts;
  }

  /** @inheritdoc */
  async getCollectionConfigs(): Promise<CollectionConfig[]> {
    const collects: Config[] | undefined = this.collectorConfig?.getConfigArray('collects');

    if (collects === undefined || collects.length === 0) {
      return [];
    }

    const factNames: string[] = (await this.getFactNames()).map((factName: string) => {
      return `${this.id}:default/${factName}`;
    });

    return collects.map((collect: Config) => {
      return {
        factRefs: factNames,
        filter: collect.getOptional('filter') ?? this.config?.getOptional('filter') ?? undefined,
        exclude: collect.getOptional('exclude') ?? this.config?.getOptional('exclude') ?? undefined,
        frequency: collect.getOptional('frequency') ?? this.config?.getOptional('frequency') ?? undefined,
        initialDelay: collect.getOptional('initialDelay') ?? this.config?.getOptional('initialDelay') ?? undefined,
        batchSize: collect.getOptional('batchSize') ?? this.config?.getOptional('batchSize') ?? undefined,
        cache: collect.getOptional('cache') ?? this.config?.getOptional('cache') ?? undefined
      }
    });
  }

  /** @inheritdoc */
  async getDataSchema(
    factRef: FactRef,
  ): Promise<string | undefined> {
    switch (factRef) {
      case 'dependency-composer':
        return JSON.stringify(RedHatCoreDependencyComposerSchema);

      case 'dependency-drupal':
        return JSON.stringify(RedHatCoreDependencyDrupalSchema);

      case 'status':
        return JSON.stringify(RedHatCoreStatusSchema);

      default:
        return undefined;
    }
  }

  /** @inheritdoc */
  async getFactNames(): Promise<string[]> {
    return [
      'dependency-composer',
      'dependency-drupal',
      'status',
    ];
  }

  /**
   * Collect Composer dependency facts.
   *
   * @param {Entity} entity
   *   Entity.
   * @param {FactRef} factRef
   *   Fact ref.
   *
   * @return {Promise<Fact | undefined>}
   *   New fact, or undefined on failure.
   *
   * @protected
   */
  protected async collectDependencyComposer(
    entity: Entity,
    factRef: FactRef,
  ): Promise<Fact | undefined> {
    // Get the dependencies.
    const response = await this.sendRequest(entity, '/api/red-hat-core/status/dependency/composer');
    const dependencies = response.data.dependencies.composer;

    return {
      factRef: factRef,
      entityRef: stringifyEntityRef(entity),
      data: {
        dependencies: dependencies,
      },
      timestamp: DateTime.utc().toISO(),
    };
  }

  /**
   * Collect Drupal dependency facts.
   *
   * @param {Entity} entity
   *   Entity.
   * @param {FactRef} factRef
   *   Fact ref.
   *
   * @return {Promise<Fact | undefined>}
   *   New fact, or undefined on failure.
   *
   * @protected
   */
  protected async collectDependencyDrupal(
    entity: Entity,
    factRef: FactRef,
  ): Promise<Fact | undefined> {
    const response = await this.sendRequest(entity, '/api/red-hat-core/status/dependency/drupal');
    const dependencies = response.data.dependencies.drupal;

    return {
      factRef: factRef,
      entityRef: stringifyEntityRef(entity),
      data: {
        dependencies: dependencies,
      },
      timestamp: DateTime.utc().toISO(),
    };
  }

  /**
   * Collect status facts.
   *
   * @param {Entity} entity
   *   Entity.
   * @param {FactRef} factRef
   *   Fact ref.
   *
   * @return {Promise<Fact | undefined>}
   *   New fact, or undefined on failure.
   *
   * @protected
   */
  protected async collectStatus(
    entity: Entity,
    factRef: FactRef,
  ): Promise<Fact | undefined> {
    const response = await this.sendRequest(entity, '/api/red-hat-core/status');
    const statuses: Status[] = response.data.statuses;

    for (const status of statuses) {
      // Convert the cron value from something like "last run 2 days 6 hours
      // ago" to a normal Date object.
      if (status.id === 'cron') {
        status.value = status.value.replace('Last run ', '');
        status.value = chrono.parseDate(status.value)?.toISOString() ?? status.value;
      }
      // Extract only the PHP version from the full status, which normally
      // includes an HTML link.
      if (status.id === 'php') {
        // Regex from https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string.
        const pattern = /(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?/g;
        status.value = status.value.match(pattern)?.shift() ?? status.value;
      }
    }

    return {
      factRef: factRef,
      entityRef: stringifyEntityRef(entity),
      data: {
        statuses: statuses,
      },
      timestamp: DateTime.utc().toISO(),
    };
  }

  /**
   * Get the API token for an entity.
   *
   * @param {Entity} entity
   *   Entity to get the API token for.
   *
   * @return {string}
   *   API token.
   *
   * @throws {EntityMissingCmdbAnnotationError | CmdbTokenConfigurationPairMissingError}
   *
   * @protected
   */
  protected getEntityToken(
    entity: Entity,
  ): string {
    // Get the entity's CMDB code.
    if (!entity.metadata.annotations?.hasOwnProperty(this.annotationAppCmdbCode)) {
      throw new EntityMissingCmdbAnnotationError(`Unable to get CMDB code from entity ${stringifyEntityRef(entity)}.`);
    }
    const appCode: string = entity.metadata.annotations[this.annotationAppCmdbCode];

    // Get the CMDB code/token pair configuration.
    const platformConfig: Config | undefined = this.platforms.find((platform) => platform.get('appCode') === appCode);
    if (platformConfig === undefined) {
      throw new CmdbTokenConfigurationPairMissingError(`CMDB app code and token configuration not found for ${stringifyEntityRef(entity)}.`);
    }

    return platformConfig.get('token');
  }

  /**
   * Get the production link from an entity's links.
   *
   * @param {Entity} entity
   *   Entity to get the production link from.
   *
   * @return {EntityLink}
   *   Entity link.
   *
   * @throws {EntityMissingProductionLinkError}
   *
   * @protected
   */
  protected getEntityProductionLink(
    entity: Entity,
  ): EntityLink {
    const links: EntityLink[] = entity.metadata.links ?? [];
    this.logger.debug(`Links for entity ${stringifyEntityRef(entity)}: ${JSON.stringify(links)}`);
    const productionLink: EntityLink | undefined = links.find((link) => link.title === 'Origin Production URL');
    // Throw an error if the production origin link was not found.
    if (productionLink === undefined) {
      throw new EntityMissingProductionLinkError(`Unable to find production origin link for entity ${stringifyEntityRef(entity)}.`);
    }

    return productionLink;
  }

  /**
   * Sends HTTP requests to API endpoints.
   *
   * @param entity
   *   Entity.
   * @param endpoint
   *   Endpoint starting with a forward slash.
   *
   * @return {any}
   *   Response data.
   *
   * @throws {NotOkResponseError}
   *
   * @protected
   */
  protected async sendRequest(
    entity: Entity,
    endpoint: string,
  ): Promise<any> {
    // Build the cache key.
    const cacheKey = `red-hat-core-fact-collector:${endpoint}:${entity.metadata.uid}`;
    // Try to get data from the cache.
    const cachedData: any = await this.cache.get(cacheKey);
    // Return the cached data if it exists.
    if (cachedData !== undefined) {
      this.logger.debug(`Returning cached data from ${endpoint} for ${stringifyEntityRef(entity)} using cache key ${cacheKey}`);

      return cachedData;
    }
    this.logger.debug(`No cached data from ${endpoint} for ${stringifyEntityRef(entity)} using cache key ${cacheKey}`);

    // Get the production origin link from the entity.
    const productionLink = this.getEntityProductionLink(entity);
    // Get the API token for the entity.
    const token = this.getEntityToken(entity);
    // Get the Drupal dependency information from the Red Hat Core API.
    const url: string = `${productionLink.url}${endpoint}`;
    const response: Response = await fetch(url, {
      headers: {
        "X-API-KEY": token,
      },
    });

    // If the response was not HTTP 2xx, throw an error.
    if (!response.ok) {
      throw new NotOkResponseError(`HTTP ${response.status} response from ${url} for entity ${stringifyEntityRef(entity)}`);
    }

    // Get and decode the response body.
    const responseData = await response.json();

    // Set the decoded body in the cache.
    await this.cache.set(
      cacheKey,
      responseData,
      {
        // The TTL is in milliseconds. 3,600,000 milliseconds is 1 hour.
        ttl: 3600000,
      }
    );

    return responseData;
  }

}
