'use strict';

import {
  FactCollector,
} from '@spotify/backstage-plugin-soundcheck-node';
import {
  CacheService,
  LoggerService,
  RootConfigService,
} from '@backstage/backend-plugin-api';
import {
  Entity,
  stringifyEntityRef,
} from '@backstage/catalog-model';
import {
  Gitlab as GitlabCore,
} from '@gitbeaker/core';
import {
  Gitlab,
} from '@gitbeaker/rest';
import {
  CollectionConfig,
  CollectionError,
  Fact,
  FactRef,
  parseFactRef,
} from '@spotify/backstage-plugin-soundcheck-common';
import {
  DateTime,
} from 'luxon';
import {
  DroperatorResponse,
} from '../types/DroperatorResponse';

/**
 * Fact collector for Droperator version information.
 */
export class DroperatorFactCollector implements FactCollector {

  /** @inheritdoc */
  id: string = 'droperator';

  /** @inheritdoc */
  name: string = 'Droperator';

  /** @inheritdoc */
  description: string = 'Collects facts about the Droperator platform.';

  /**
   * Cache service.
   *
   * @type {CacheService}
   *
   * @protected
   */
  protected cache: CacheService;

  /**
   * GitLab client.
   *
   * @type {Gitlab}
   *
   * @protected
   */
  protected gitlab: GitlabCore;

  /**
   * Logger service.
   *
   * @type {LoggerService}
   *
   * @protected
   */
  protected logger: LoggerService;

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
   * @return {DroperatorFactCollector}
   *   Instance of this class.
   */
  public static create(
    cache: CacheService,
    config: RootConfigService,
    logger: LoggerService,
  ): DroperatorFactCollector {
    const gitlabConfig = config.getOptionalConfigArray("integrations.gitlab") ?? [];

    return new this(
      cache,
      new Gitlab({
        host: `https://${gitlabConfig[0].get('host')}`,
        token: gitlabConfig[0].get('token'),
      }),
      logger,
    );
  }

  /**
   * Constructor.
   *
   * @param {CacheService} cache
   *   Cache service.
   * @param {Gitlab<C>} gitlab
   *   GitLab client.
   * @param {LoggerService} logger
   *   Logger service.
   *
   * @protected
   */
  protected constructor(
    cache: CacheService,
    gitlab: GitlabCore,
    logger: LoggerService,
  ) {
    this.cache = cache;
    this.gitlab = gitlab;
    this.logger = logger.child({
      target: 'DroperatorFactCollector',
    });
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

        switch (parsedFactRef.name) {
          case 'version':
            fact = await this.collectVersion(
              entity,
              factRef,
            );
            break;

          default:
          // Do nothing.
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
    return [];
  }

  /** @inheritdoc */
  async getDataSchema(
    factRef: FactRef,
  ): Promise<string | undefined> {
    switch (factRef) {
      case 'version':
        return JSON.stringify({
          title: 'Version',
          description: 'Droperator version information',
          type: 'object',
          properties: {
            info: {
              type: 'object',
              properties: {
                gitRef: {
                  type: 'string',
                },
                gitSha: {
                  type: 'string',
                },
                appName: {
                  type: 'string',
                },
                dropCmdbCode: {
                  type: 'string',
                },
                dropPipelineVersion: {
                  type: 'string',
                },
              },
            },
            versionLatest: {
              type: 'string',
            },
          },
        });

      default:
        return undefined;
    }
  }

  /** @inheritdoc */
  async getFactNames(): Promise<string[]> {
    return [
      'version',
    ];
  }

  /**
   * Collect Droperator version facts.
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
  protected async collectVersion(
    entity: Entity,
    factRef: FactRef,
  ): Promise<Fact | undefined> {
    //  Get the production origin link from the entity.
    const links = entity.metadata.links ?? [];
    this.logger.debug(`Links for entity ${stringifyEntityRef(entity)}: ${JSON.stringify(links)}`);
    const productionLink = links.find((link) => link.title === 'Origin Production URL');

    // Log a message and return undefined if the production origin link was not
    // found.
    if (productionLink === undefined) {
      this.logger.info(`Unable to find production origin link for entity ${stringifyEntityRef(entity)} in DroperatorFactCollector.`);

      return undefined;
    }

    // Get the Droperator version information from the version endpoint.
    const url: string = `${productionLink.url}/version`;
    const response: Response = await fetch(url);

    // If the response was not HTTP 2xx, log a message and return undefined.
    if (!response.ok) {
      this.logger.info(`HTTP ${response.status} response from ${url} while trying to get Droperator info for entity ${stringifyEntityRef(entity)} in DroperatorFactCollector`);

      return undefined;
    }

    // Get the response body.
    const droperatorResponse: DroperatorResponse = await response.json();

    return {
      factRef: factRef,
      entityRef: stringifyEntityRef(entity),
      data: {
        info: {
          appName: droperatorResponse.APP_NAME,
          dropCmdbCode: droperatorResponse.DROP_CMDB_CODE,
          dropPipelineVersion: droperatorResponse.DROP_PIPELINE_VERSION,
          gitRef: droperatorResponse.GIT_REF,
          gitSha: droperatorResponse.GIT_SHA,
        },
        versionLatest: await this.getDroperatorLatestTag() ?? null,
      },
      timestamp: DateTime.utc().toISO(),
    };
  }

  /**
   * Get the latest Droperator tag.
   *
   * @return {Promise<string | undefined>}
   *   The latest tag name string, or undefined on failure.
   *
   * @protected
   */
  protected async getDroperatorLatestTag(): Promise<string | undefined> {
    const cacheKey = 'droperator-fact-collector:latest-droperator-tag';

    // Try to get the latest Droperator tag from the cache.
    let latestTag: string | undefined = await this.cache.get(cacheKey);

    // If the latest tag was not found, get it from the GitLab API.
    if (!latestTag) {
      const tags = await this.gitlab.Tags.all(
        'dxp/dat/droperator-platform/droperator-pipeline',
        {
          orderBy: 'version',
        },
      ) ?? [];
      // Shift the first tag off of the results array.
      const fullLatestTag = tags.shift();
      // If there was no latest tag, something has gone wrong, because
      // Droperator definitely has tags.
      if (fullLatestTag === undefined) {
        this.logger.error(`Unable to get latest Droperator tag in DroperatorFactCollector.`);

        return undefined;
      }
      // Get the name of the latest tag.
      latestTag = fullLatestTag.name;
      // Store the latest tag in the cache.
      await this.cache.set(
        cacheKey,
        latestTag,
        {
          // The TTL is in milliseconds. 3,600,000 milliseconds is 1 hour.
          ttl: 3600000,
        },
      );
    }

    return latestTag;
  }

}
