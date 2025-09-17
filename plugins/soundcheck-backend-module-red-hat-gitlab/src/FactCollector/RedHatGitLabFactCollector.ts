'use strict';

import { FactCollector } from '@spotify/backstage-plugin-soundcheck-node';
import {
  CacheService,
  LoggerService,
  RootConfigService,
} from '@backstage/backend-plugin-api';
import { Entity, stringifyEntityRef } from '@backstage/catalog-model';
import {
  CollectionConfig,
  CollectionError,
  Fact,
  FactRef,
  parseFactRef,
  stringifyFactRef,
} from '@spotify/backstage-plugin-soundcheck-common';
import {
  ExpandedPipelineSchema,
  Gitlab as GitlabCore,
  JobSchema,
  RepositoryTreeSchema,
  TagSchema,
} from '@gitbeaker/core';
import { Gitlab } from '@gitbeaker/rest';
import { DateTime } from 'luxon';
import { parse as yamlParse } from 'yaml';
import { ParsedComponent } from '../types/ParsedComponent';
import { RequiredInclude } from '../types/RequiredInclude';
import { XMLParser } from 'fast-xml-parser';
import { FactNames } from '../enums/FactNames';
import { Config } from '@backstage/config';
import RedHatGitLabCommitSchema from '../schemas/RedHatGitLabCommit.schema.json';
import RedHatGitLabDrupalExtensionInfoFileSchema from '../schemas/RedHatGitLabDrupalExtensionInfoFile.schema.json';
import RedHatGitLabMergeRequestApprovalRules from '../schemas/RedHatGitLabMergeRequestApprovalRules.schema.json';
import RedHatGitLabRepositoryTreeSchema from '../schemas/RedHatGitLabRepositoryTree.schema.json';

/**
 * Fact collector for facts not covered by the Spotify GitLab fact collector.
 */
export class RedHatGitLabFactCollector implements FactCollector {
  /** @inheritdoc */
  id: string = 'red-hat-gitlab';

  /** @inheritdoc */
  name: string = 'Red Hat GitLab';

  /** @inheritdoc */
  description: string =
    'Collects GitLab facts not covered by the Spotify GitLab fact collector.';

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
  protected collectorConfig?: Config | undefined;

  /**
   * Config service.
   *
   * @type {RootConfigService}
   *
   * @protected
   */
  protected config: RootConfigService;

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
   * Project tags record, keyed by project name.
   *
   * @type {Record<string, TagSchema | undefined>}
   *
   * @protected
   */
  protected projectTags: Record<string, TagSchema | undefined> = {};

  /**
   * XML parser.
   *
   * @type {XMLParser}
   *
   * @protected
   */
  protected xmlParser: XMLParser;

  /**
   * Static factory method.
   *
   * @param {CacheService} cache
   *   Cache service.
   * @param {RootConfigService} config
   *   Root configuration service.
   * @param {LoggerService} logger
   *   Logger service.
   */
  public static create(
    cache: CacheService,
    config: RootConfigService,
    logger: LoggerService,
  ): RedHatGitLabFactCollector {
    const gitlabConfig =
      config.getOptionalConfigArray('integrations.gitlab') ?? [];

    return new this(
      cache,
      config,
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
   * @param {RootConfigService} config
   *   Config service.
   * @param {Gitlab} gitlab
   *   GitLab client.
   * @param {LoggerService} logger
   *   Logger service.
   */
  protected constructor(
    cache: CacheService,
    config: RootConfigService,
    gitlab: GitlabCore,
    logger: LoggerService,
  ) {
    this.cache = cache;
    this.config = config;
    this.gitlab = gitlab;
    this.logger = logger.child({
      target: 'RedHatGitLabFactCollector',
    });
    this.xmlParser = new XMLParser();

    this.collectorConfig = this.config.getOptionalConfig(
      'soundcheck.collectors.redHatGitLab',
    );
    if (!this.collectorConfig) {
      throw new Error('Missing config at soundcheck.collectors.redHatGitLab');
    }
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

    // Collect facts for each entity.
    for (const entity of entities) {
      const gitlabProjectId =
        entity.metadata.annotations?.['gitlab.com/project-slug'];
      // Skip this entity if the GitLab project information is missing.
      if (gitlabProjectId === undefined) {
        this.logger.warn(
          `Entity ${stringifyEntityRef(
            entity,
          )} is missing the 'gitlab.com/project-slug' annotation in RedHatGitLabFactCollector.`,
        );

        continue;
      }
      // Collect each fact.
      for (const factRef of params?.factRefs ?? []) {
        const parsedFactRef = parseFactRef(factRef);

        let fact: Fact | undefined;

        fact = undefined;

        switch (parsedFactRef.name) {
          case FactNames.CodeCoverage:
            fact = await this.collectCodeCoverage(
              entity,
              factRef,
              gitlabProjectId,
            );
            break;

          case FactNames.ComposerLockModified:
            fact = await this.collectComposerLockModified(
              entity,
              factRef,
              gitlabProjectId,
            );
            break;

          case FactNames.DrupalExtensionInfoFile:
            fact = await this.collectDrupalExtensionInfoFile(
              entity,
              factRef,
              gitlabProjectId,
            );
            break;

          case FactNames.Environments:
            fact = await this.collectEnvironments(
              entity,
              factRef,
              gitlabProjectId,
            );
            break;

          case FactNames.LatestCommit:
            fact = await this.collectLatestCommit(
              entity,
              factRef,
              gitlabProjectId,
            );
            break;

          case FactNames.LatestPipeline:
            fact = await this.collectLatestPipeline(
              entity,
              factRef,
              gitlabProjectId,
            );
            break;

          case FactNames.MergeRequestApprovalRules:
            fact = await this.collectMergeRequestApprovalRules(
              entity,
              factRef,
              gitlabProjectId,
            );
            break;

          case FactNames.RepositoryTree:
            fact = await this.collectRepositoryTree(
              entity,
              factRef,
              gitlabProjectId,
            );
            break;

          case FactNames.SharedStages:
            fact = await this.collectSharedStages(
              entity,
              factRef,
              gitlabProjectId,
            );
            break;

          case FactNames.ProtectedBranches:
            fact = await this.collectProtectedBranches(
              entity,
              factRef,
              gitlabProjectId,
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
    const collects: Config[] | undefined =
      this.collectorConfig?.getConfigArray('collects');

    if (collects === undefined || collects.length === 0) {
      return [];
    }

    const factNames: string[] = (await this.getFactNames()).map(
      (factName: string) => {
        return `${this.id}:default/${factName}`;
      },
    );

    return collects.map((collect: Config) => {
      return {
        factRefs: factNames,
        filter:
          collect.getOptional('filter') ??
          this.config?.getOptional('filter') ??
          undefined,
        exclude:
          collect.getOptional('exclude') ??
          this.config?.getOptional('exclude') ??
          undefined,
        frequency:
          collect.getOptional('frequency') ??
          this.config?.getOptional('frequency') ??
          undefined,
        initialDelay:
          collect.getOptional('initialDelay') ??
          this.config?.getOptional('initialDelay') ??
          undefined,
        batchSize:
          collect.getOptional('batchSize') ??
          this.config?.getOptional('batchSize') ??
          undefined,
        cache:
          collect.getOptional('cache') ??
          this.config?.getOptional('cache') ??
          undefined,
      };
    });
  }

  /** @inheritdoc */
  async getDataSchema(factRef: FactRef): Promise<string | undefined> {
    switch (factRef) {
      case FactNames.CodeCoverage:
        return JSON.stringify({
          title: 'Code coverage',
          description: 'Percentage of code covered by automated tests.',
          type: 'object',
          properties: {
            coverage: {
              type: 'number',
            },
          },
        });

      case FactNames.ComposerLockModified:
        return JSON.stringify({
          title: 'Composer lock file modified',
          description: 'The time the composer.lock file was last modified.',
          type: 'object',
          properties: {
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
          },
        });

      case FactNames.DrupalExtensionInfoFile:
        return JSON.stringify(RedHatGitLabDrupalExtensionInfoFileSchema);

      case FactNames.Environments:
        return JSON.stringify({
          title: 'Environments',
          description: 'Environments information.',
          type: 'object',
          properties: {
            environments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'integer',
                  },
                  name: {
                    type: 'string',
                  },
                  external_url: {
                    type: 'string',
                    format: 'uri',
                  },
                  state: {
                    type: 'string',
                  },
                  created_at: {
                    type: 'string',
                    format: 'date-time',
                  },
                  updated_at: {
                    type: 'string',
                    format: 'date-time',
                  },
                  tier: {
                    type: 'string',
                  },
                },
              },
            },
          },
        });

      case FactNames.LatestCommit:
        return JSON.stringify(RedHatGitLabCommitSchema);

      case FactNames.LatestPipeline:
        return JSON.stringify({
          title: 'Latest pipeline',
          description:
            'Information about the most recent successful pipeline, such as the jobs that ran.',
          type: 'object',
          properties: {
            jobs: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            pipeline_id: {
              type: ['string', 'null'],
            },
          },
        });

      case FactNames.ProtectedBranches:
        return JSON.stringify({
          title: 'Protected branches',
          description:
            'Information about protected branches, including access levels and rules such as force push and code owner requirements.',
          type: 'object',
          properties: {
            branches: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                  },
                  allow_force_push: {
                    type: 'boolean',
                  },
                  code_owner_approval_required: {
                    type: 'boolean',
                  },
                },
                required: ['name'],
              },
            },
          },
        });

      case FactNames.MergeRequestApprovalRules:
        return JSON.stringify(RedHatGitLabMergeRequestApprovalRules);

      case FactNames.RepositoryTree:
        return JSON.stringify(RedHatGitLabRepositoryTreeSchema);

      case FactNames.SharedStages:
        return JSON.stringify({
          title: 'Shared stages and includes status',
          description:
            'Status of shared stages / includes. Mainly focuses on whether the shared stages are up-to-date. Using the special ~latest tag for Evergreen CI automatically counts as up-to-date.',
          type: 'object',
          properties: {
            includes: {
              type: 'object',
              additionalProperties: {
                type: 'string',
              },
            },
            project_type: {
              type: 'string',
            },
            required_includes: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            up_to_date: {
              type: 'boolean',
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
      FactNames.CodeCoverage,
      FactNames.ComposerLockModified,
      FactNames.DrupalExtensionInfoFile,
      FactNames.Environments,
      FactNames.LatestCommit,
      FactNames.LatestPipeline,
      FactNames.MergeRequestApprovalRules,
      FactNames.RepositoryTree,
      FactNames.SharedStages,
      FactNames.ProtectedBranches,
    ];
  }

  /**
   * Collect the code coverage fact.
   *
   * @param {Entity} entity
   *   Entity.
   * @param {FactRef} factRef
   *   Fact ref.
   * @param {string | number} gitlabProjectId
   *   GitLab project ID.
   *
   * @return {Promise<Fact | undefined>}
   *   New fact, or undefined on failure.
   *
   * @protected
   */
  protected async collectCodeCoverage(
    entity: Entity,
    factRef: FactRef,
    gitlabProjectId: string | number,
  ): Promise<Fact | undefined> {
    // Get the latest successful pipeline.
    const pipeline = await this.getProjectLatestSuccessfulPipeline(
      gitlabProjectId,
    );

    return {
      factRef: factRef,
      entityRef: stringifyEntityRef(entity),
      data: {
        // Default to 0 code coverage if the pipeline was not found.
        coverage: pipeline?.coverage ?? 0.0,
      },
      timestamp: DateTime.utc().toISO(),
    };
  }

  /**
   * Collect the composer lock modification time fact.
   *
   * @param {Entity} entity
   *   Entity.
   * @param {FactRef} factRef
   *   Fact ref.
   * @param {string | number} gitlabProjectId
   *   GitLab project ID.
   *
   * @return {Promise<Fact | undefined>}
   *   New fact, or undefined on failure.
   *
   * @protected
   */
  protected async collectComposerLockModified(
    entity: Entity,
    factRef: FactRef,
    gitlabProjectId: string | number,
  ): Promise<Fact | undefined> {
    // Get the file modification time.
    const modified_time = await this.getProjectComposerLockModified(
      gitlabProjectId,
    );
    // If the file modification time was not found, skip this fact for
    // this entity.
    if (modified_time === undefined) {
      this.logger.error(
        `Unable to collect ${stringifyFactRef(
          factRef,
        )}: unable to get modification time for composer.lock for GitLab project "${gitlabProjectId}" in RedHatGitLabFactCollector.`,
      );

      return undefined;
    }

    return {
      factRef: factRef,
      entityRef: stringifyEntityRef(entity),
      data: {
        timestamp: modified_time.toString(),
      },
      timestamp: DateTime.utc().toISO(),
    };
  }

  /**
   * Collect the Drupal extension info file fact.
   *
   * @param {Entity} entity
   *   Entity.
   * @param {FactRef} factRef
   *   Fact ref.
   * @param {string | number} gitlabProjectId
   *   GitLab project ID.
   *
   * @return {Promise<Fact | undefined>}
   *   New fact, or undefined on failure.
   *
   * @protected
   */
  protected async collectDrupalExtensionInfoFile(
    entity: Entity,
    factRef: FactRef,
    gitlabProjectId: string | number,
  ): Promise<Fact | undefined> {
    this.logger.info(
      `Getting Drupal extension info file from GitLab project ${gitlabProjectId}`,
    );
    // Check the cache before sending a request to the Drupal release history
    // API.
    const drupalReleaseHistoryCacheKey: string =
      'red-hat-gitlab:drupal-release-history';
    let drupalReleaseHistory: any = await this.cache.get(
      drupalReleaseHistoryCacheKey,
    );
    // If the cache was empty, get the release history from the API.
    if (drupalReleaseHistory === undefined) {
      const drupalReleaseHistoryUrl: string =
        'https://updates.drupal.org/release-history/drupal/current';
      this.logger.debug(`No drupal release history in cache`);
      // The API is public, no authentication is necessary.
      const drupalReleaseHistoryResponse: Response = await fetch(
        drupalReleaseHistoryUrl,
      );
      this.logger.debug(
        `HTTP ${drupalReleaseHistoryResponse.status} response from ${drupalReleaseHistoryUrl}.`,
      );
      // If the response was not HTTP 200, return undefined.
      if (!drupalReleaseHistoryResponse.ok) {
        this.logger.error(
          `HTTP ${drupalReleaseHistoryResponse.status} response from ${drupalReleaseHistoryUrl}.`,
        );

        return undefined;
      }
      // Parse the XML response into an object.
      drupalReleaseHistory = this.xmlParser.parse(
        await drupalReleaseHistoryResponse.text(),
      );
      // If the parser did not parse the XML, return undefined.
      if (drupalReleaseHistory === undefined) {
        this.logger.error(`Unable to parse Drupal release history XML.`);

        return undefined;
      }
      // Store the parsed object in the cache.
      this.cache.set(drupalReleaseHistoryCacheKey, drupalReleaseHistory, {
        // TTL is in milliseconds, 3600000 is one hour.
        ttl: 3600000,
      });
    }

    // Get the supported branches from the parsed object. The value is a string
    // formatted like: '10.3.,10.4.,10.5.,11.0.,11.1.'. The API provides it
    // sorted by version.
    let supportedBranches: string =
      drupalReleaseHistory.project.supported_branches;
    // Split the string by commas.
    const supportedBranchesSplit: string[] = supportedBranches.split(',');
    // Loop over the array to modify the strings.
    supportedBranchesSplit.forEach((branch: string, index: number) => {
      let requirement = branch;
      // Remove the '.' from the end of the string.
      requirement = requirement.substring(0, requirement.length - 1);
      // Prefix the string with '^'.
      requirement = `^${requirement}`;
      // Replace the branch name with the proper requirement.
      supportedBranchesSplit[index] = requirement;
    });
    // Create a version requirement out of the branches, which will look like:
    // '^10.3 || ^10.4 || ^10.5 || ^11.0 || ^11.1'.
    supportedBranches = supportedBranchesSplit.join(' || ');
    // Get the highest supported branch from the end of the array.
    let highestBranch: string | undefined = supportedBranchesSplit.pop();
    // This shouldn't happen unless something has gone horribly wrong well
    // before now, but handle it just in case.
    if (highestBranch === undefined) {
      this.logger.error(
        `Highest supported Drupal branch is empty, source value from API is ${drupalReleaseHistory.project.supported_branches}`,
      );

      return undefined;
    }
    // Remove the '^' so the value is just, for example, '11.1'.
    highestBranch = highestBranch.substring(1);

    // Get the GitLab project's information.
    const project = await this.gitlab.Projects.show(gitlabProjectId);
    // Get an array of the project's files.
    const projectTree = await this.gitlab.Repositories.allRepositoryTrees(
      gitlabProjectId,
    );
    // Initialize the info file variable as undefined. This is used to check if
    // no info file was found, and to make the variable accessible outside the
    // loop, because variables declared with 'let' inside a loop are not
    // accessible outside the loop. Kind of a weird decision considering you
    // have to use let if your variable is a string that you're going to modify,
    // but yeah, okay. Sure. Why not.
    let infoFile: RepositoryTreeSchema | undefined = undefined;
    // Try to get the info file using the project path. For example, for the
    // module at /dxp/dat/red_hat_core, the path property would be
    // 'red_hat_core'. This would then look for 'red_hat_core.info.yml'.
    infoFile = projectTree.find(
      file => file.name === `${project.path}.info.yml`,
    );
    // If the info file was not found, the extension uses different names for
    // the GitLab path and the .info.yml file(s). This isn't a great practice,
    // but it's not unheard of, and must be handled.
    if (infoFile === undefined) {
      for (const file of projectTree) {
        // Lacking anything else to go on, the first .info.yml file found is
        // good enough.
        if (file.name.endsWith('.info.yml')) {
          this.logger.info(
            `First info file found for ${gitlabProjectId}: ${file.name}`,
          );
          infoFile = file;
          break;
        }
      }
    }

    // If no info file was found at all, return undefined.
    if (infoFile === undefined) {
      this.logger.error(
        `Unable to find .info.yml file for project ${gitlabProjectId}`,
      );

      return undefined;
    }

    // Get the raw YAML of the info file.
    const infoFileContents = await this.gitlab.RepositoryFiles.showRaw(
      gitlabProjectId,
      infoFile.name,
      project.default_branch,
    );

    // If the contents are not a string, or if the string is empty, return
    // undefined.
    if (typeof infoFileContents !== 'string' || infoFileContents.length < 1) {
      this.logger.error(`Unable to get contents of file ${infoFile.name}`);

      return undefined;
    }

    // Parse the YAML into an object.
    const parsedInfoFile = yamlParse(infoFileContents);
    // If the YAML was not parsed into an object, return undefined.
    if (typeof parsedInfoFile !== 'object') {
      this.logger.error(
        `Unable to parse info file ${infoFile.name} from GitLab project ${gitlabProjectId}`,
      );

      return undefined;
    }

    // Return the fact.
    return {
      factRef: factRef,
      entityRef: stringifyEntityRef(entity),
      data: {
        // Parse the YAML to an object.
        contents: parsedInfoFile,
        drupalCoreHighestBranch: highestBranch,
        drupalCoreSupportedBranches: supportedBranches,
        raw: infoFileContents,
      },
      timestamp: DateTime.utc().toISO(),
    };
  }

  /**
   * Collect the environment facts.
   *
   * @param {Entity} entity
   *   Entity.
   * @param {FactRef} factRef
   *   Fact ref.
   * @param {string | number} gitlabProjectId
   *   GitLab project ID.
   *
   * @return {Promise<Fact | undefined>}
   *   New fact, or undefined on failure.
   *
   * @protected
   */
  protected async collectEnvironments(
    entity: Entity,
    factRef: FactRef,
    gitlabProjectId: string | number,
  ): Promise<Fact | undefined> {
    const environment_facts: object[] = [];

    const environments = await this.gitlab.Environments.all(gitlabProjectId);
    for (const environment of environments) {
      environment_facts.push({
        id: environment.id,
        name: environment.name,
        external_url: environment.external_url,
        state: environment.state,
        created_at: DateTime.fromISO(environment.created_at).toISO(),
        updated_at: DateTime.fromISO(environment.updated_at).toISO(),
        tier: environment.tier,
      });
    }

    return {
      factRef: factRef,
      entityRef: stringifyEntityRef(entity),
      data: {
        environments: environment_facts,
      },
      timestamp: DateTime.utc().toISO(),
    };
  }

  /**
   * Collect the latest commit on a project's default branch.
   *
   * @param {Entity} entity
   *   Entity.
   * @param {FactRef} factRef
   *   Fact ref.
   * @param {string | number} gitlabProjectId
   *   GitLab project ID.
   *
   * @return {Promise<Fact | undefined>}
   *   New fact, or undefined on failure.
   *
   * @protected
   */
  protected async collectLatestCommit(
    entity: Entity,
    factRef: FactRef,
    gitlabProjectId: string | number,
  ): Promise<Fact | undefined> {
    const project = await this.gitlab.Projects.show(gitlabProjectId);
    // If the project could not be found, return undefined.
    if (project === undefined) {
      this.logger.error(`Unable to get GitLab project ${gitlabProjectId}`);

      return undefined;
    }
    const commit = await this.gitlab.Commits.show(
      gitlabProjectId,
      project.default_branch,
    );
    // If the most recent commit could not be found, return undefined.
    if (commit === undefined) {
      this.logger.error(
        `Unable to get latest commit for GitLab project ${gitlabProjectId}`,
      );

      return undefined;
    }

    return {
      factRef: factRef,
      entityRef: stringifyEntityRef(entity),
      data: {
        // This is silly, but the type of the commit, ExpandedCommitSchema, is
        // apparently not assignable to JsonValue. It worked anyway without the
        // JSON stringify and parse, but the IDE was complaining. This stops it
        // from complaining.
        commit: JSON.parse(JSON.stringify(commit)),
      },
      timestamp: DateTime.utc().toISO(),
    };
  }

  /**
   * Collect the latest pipeline jobs fact.
   *
   * @param {Entity} entity
   *   Entity.
   * @param {FactRef} factRef
   *   Fact ref.
   * @param {string | number} gitlabProjectId
   *   GitLab project ID.
   *
   * @return {Promise<Fact | undefined>}
   *   New fact, or undefined on failure.
   *
   * @protected
   */
  protected async collectLatestPipeline(
    entity: Entity,
    factRef: FactRef,
    gitlabProjectId: string | number,
  ): Promise<Fact | undefined> {
    // Get the latest successful pipeline.
    const pipeline = await this.getProjectLatestSuccessfulPipeline(
      gitlabProjectId,
    );
    // Initialize an empty array for jobs.
    let jobs: JobSchema[] = [];
    // If a pipeline was found, get the jobs for that pipeline.
    if (pipeline !== undefined) {
      jobs = await this.gitlab.Jobs.all(gitlabProjectId, {
        pipelineId: pipeline.id,
      });
    }

    return {
      factRef: factRef,
      entityRef: stringifyEntityRef(entity),
      data: {
        // If no jobs were found, this callback will produce an empty array.
        jobs: jobs.map(job => job.name),
        pipeline_id: pipeline?.id ?? null,
      },
      timestamp: DateTime.utc().toISO(),
    };
  }

  /**
   * Collect a repository's tree.
   *
   * @param {Entity} entity
   *   Entity.
   * @param {FactRef} factRef
   *   Fact ref.
   * @param {string | number} gitlabProjectId
   *   GitLab project ID.
   *
   * @return {Promise<Fact | undefined>}
   *   New fact, or undefined on failure.
   *
   * @protected
   */
  protected async collectRepositoryTree(
    entity: Entity,
    factRef: FactRef,
    gitlabProjectId: string | number,
  ): Promise<Fact | undefined> {
    try {
      const tree = await this.gitlab.Repositories.allRepositoryTrees(
        gitlabProjectId,
        {
          perPage: 100,
        },
      );

      if (tree === undefined) {
        this.logger.error(
          `Unable to get repository tree for GitLab project ${gitlabProjectId}`,
        );

        return undefined;
      }

      return {
        factRef: factRef,
        entityRef: stringifyEntityRef(entity),
        data: {
          tree: tree.map(leaf => ({
            id: leaf.id,
            name: leaf.name,
            type: leaf.type,
            path: leaf.path,
            mode: leaf.mode,
          })),
        },
        timestamp: DateTime.utc().toISO(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch repository tree for project ${gitlabProjectId}: ${error}`,
      );
      return undefined;
    }
  }

  /**
   * Collect merge request approval rules.
   *
   * This really ought to be in the main GitLab fact collector plugin, but it is
   * not, so here we are.
   *
   * @param {Entity} entity
   *   Entity.
   * @param {FactRef} factRef
   *   Fact ref.
   * @param {string | number} gitlabProjectId
   *   GitLab project ID.
   *
   * @return {Promise<Fact | undefined>}
   *   New fact, or undefined on failure.
   *
   * @protected
   */
  protected async collectMergeRequestApprovalRules(
    entity: Entity,
    factRef: FactRef,
    gitlabProjectId: string | number,
  ): Promise<Fact | undefined> {
    try {
      // Get approval rules from the GitLab API.
      const rules = await this.gitlab.MergeRequestApprovals.allApprovalRules(
        gitlabProjectId,
      );

      // It should just return an empty array if no rules were found, but just in
      // case undefined comes up, handle it.
      if (rules === undefined) {
        this.logger.error(
          `Unable to get merge request approval rules for GitLab project ${gitlabProjectId}`,
        );

        return undefined;
      }

      return {
        factRef: factRef,
        entityRef: stringifyEntityRef(entity),
        data: {
          // If no rules were found, this callback will produce an empty array.

          rules: rules.map(rule => ({
            id: rule.id,
            name: rule.name,
            rule_type: rule.rule_type,
            eligible_approvers: rule.eligible_approvers?.map(
              eligible_approver => eligible_approver.id,
            ),
            approvals_required: rule.approvals_required,
            users: rule.users?.map(user => user.id),
            groups: rule.groups?.map(group => group.id),
            contains_hidden_groups: rule.contains_hidden_groups,
            protected_branches: rule.protected_branches?.map(
              protected_branch => protected_branch.name,
            ),
            applies_to_all_protected_branches:
              !!rule.applies_to_all_protected_branches,
          })),
        },
        timestamp: DateTime.utc().toISO(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch merge request approval rules for project ${gitlabProjectId}: ${error}`,
      );
      return undefined;
    }
  }

  /**
   * Collect the shared stages up-to-date fact.
   *
   * @param {Entity} entity
   *   Entity.
   * @param {FactRef} factRef
   *   Fact ref.
   * @param {string | number} gitlabProjectId
   *   GitLab project ID.
   *
   * @return {Promise<Fact | undefined>}
   *   New fact, or undefined on failure.
   *
   * @protected
   */
  protected async collectSharedStages(
    entity: Entity,
    factRef: FactRef,
    gitlabProjectId: string | number,
  ): Promise<Fact | undefined> {
    entity.metadata.tags = [];
    entity.metadata.tags.push('drupal-platform');

    // Default to false for up-to-date status.
    let up_to_date = false;
    let project_type: string | undefined = undefined;

    // Get the list of required includes by project type.
    let required_includes: RequiredInclude[] = [];
    if (entity.metadata.tags?.includes('drupal-platform')) {
      project_type = 'drupal-platform';
      required_includes = [
        {
          name: 'dxp/dat/gitlab-shared/php-code-sniffer',
          upToDate: false,
        },
        {
          name: 'dxp/dat/gitlab-shared/php-unit',
          upToDate: false,
        },
        {
          name: 'dxp/dat/gitlab-shared/php-rector',
          upToDate: false,
        },
        {
          name: 'dxp/dat/gitlab-shared/sonarqube',
          upToDate: false,
        },
      ];
    } else {
      return undefined;
    }

    // Normalize includes from the YAML.
    const includes = await this.parseProjectCiIncludes(gitlabProjectId);

    // Using the ~latest version of the Evergreen component automatically counts
    // as up-to-date.
    if (
      includes['dxp/dat/gitlab-shared/evergreen-ci'] !== undefined &&
      includes['dxp/dat/gitlab-shared/evergreen-ci'] === '~latest'
    ) {
      up_to_date = true;
    }
    // For each required include, check if it is up-to-date.
    else {
      for (const required_include of required_includes) {
        if (includes[required_include.name] === undefined) {
          required_include.upToDate = false;
        } else {
          required_include.upToDate = await this.isIncludeUpToDate(
            required_include.name,
            includes[required_include.name],
          );
        }
      }
      // Use Array.every() to check if every value in the array is true.
      up_to_date = required_includes.every(
        required_include => required_include.upToDate,
      );
    }

    return {
      factRef: factRef,
      entityRef: stringifyEntityRef(entity),
      data: {
        includes: includes,
        project_type: project_type,
        required_includes: required_includes.map(
          required_include => required_include.name,
        ),
        up_to_date: up_to_date,
      },
      timestamp: DateTime.utc().toISO(),
    };
  }

  /**
   * Get the time the composer lock file was last modified.
   *
   * @param {string | number} projectId
   *   GitLab project ID.
   *
   * @return {Promise<DateTime | undefined>}
   *   A DateTime, or undefined if the modification time could not be found.
   *
   * @protected
   */
  protected async getProjectComposerLockModified(
    projectId: string | number,
  ): Promise<DateTime | undefined> {
    // Get the GitLab project details to get the default branch.
    const project = await this.gitlab.Projects.show(projectId);

    try {
      // Get the file.
      const file = await this.gitlab.RepositoryFiles.show(
        projectId,
        'composer.lock',
        project.default_branch,
      );

      // Return undefined if the file is undefined.
      if (file === undefined) {
        this.logger.error('Unknown error while getting file');

        return undefined;
      }

      // Get the file's latest commit.
      const commit = await this.gitlab.Commits.show(
        projectId,
        file.last_commit_id,
      );

      // Return undefined if either the commit or the committed date is undefined.
      if (commit?.committed_date === undefined) {
        this.logger.error(`Unknown error while getting commit ${commit.id}`);

        return undefined;
      }

      // Return the timestamp as a DateTime.
      return DateTime.fromISO(commit.committed_date);
    } catch (e) {
      // Handle exceptions with a log message and return undefined.
      this.logger.error(
        `Error while getting composer.lock file from GitLab repository ${projectId} in RedHatGitLabFactCollector: ${e}`,
      );

      return undefined;
    }
  }

  /**
   * Get the latest successful pipeline for a project.
   *
   * @param {string | number} projectId
   *   GitLab project ID.
   *
   * @return {Promise<ExpandedPipelineSchema | undefined>}
   *   Latest pipeline, or undefined if it could not be found.
   *
   * @protected
   */
  protected async getProjectLatestSuccessfulPipeline(
    projectId: string | number,
  ): Promise<ExpandedPipelineSchema | undefined> {
    // Get the GitLab project details to get the default branch.
    const project = await this.gitlab.Projects.show(projectId);

    // Get the project's successful pipelines from the default branch, sorted
    // most recent first.
    const pipelines = await this.gitlab.Pipelines.all(projectId, {
      orderBy: 'updated_at',
      ref: project.default_branch,
      status: 'success',
    });

    // If no pipelines were found, log a message and return undefined.
    if (pipelines[0] === undefined) {
      this.logger.info(
        `No pipelines found for GitLab project ${projectId} in RedHatGitLabFactCollector.`,
      );

      return undefined;
    }

    // Get the details of the most recent pipeline.
    const pipeline = await this.gitlab.Pipelines.show(
      projectId,
      pipelines[0].id,
    );

    // If the pipeline's details weren't found, log an error and return
    // undefined.
    if (pipeline === undefined) {
      this.logger.error(
        `Unable to get pipeline ${pipelines[0].id} for GitLab project ${projectId} in RedHatGitLabFactCollector.`,
      );

      return undefined;
    }

    return pipeline;
  }

  /**
   * Get the latest tag for a project.
   *
   * @param {string | number} projectId
   *   A GitLab project ID.
   *
   * @return {Promise<string | undefined>}
   *   The latest tag for a project, or undefined if no tag was found.
   *
   * @protected
   */
  protected async getProjectLatestTag(
    projectId: string | number,
  ): Promise<string | undefined> {
    if (this.projectTags.projectId === undefined) {
      const tags =
        (await this.gitlab.Tags.all(projectId, {
          orderBy: 'version',
        })) ?? [];
      this.projectTags.projectId = tags.shift();
    }

    return this.projectTags.projectId?.name ?? undefined;
  }

  /**
   * Check if a given include is up-to-date.
   *
   * @param {string} include
   *   The name of the included project, which is the project path.
   * @param {string} version
   *   The version of the project being used.
   *
   * @return {Promise<boolean>}
   *   Whether the project is up-to-date.
   *
   * @protected
   */
  protected async isIncludeUpToDate(
    include: string,
    version: string,
  ): Promise<boolean> {
    switch (version) {
      // "~latest" is a special version used by components, and is automatically
      // up to date.
      case '~latest':
        return true;

      // Null is possible because project type includes do not require the 'ref'
      // property, which causes the include to reference HEAD on the project's
      // default branch, so it is up to date.
      case undefined:
      case null:
        return true;

      // Using the default branch instead of a tag counts as up to date.
      case (await this.gitlab.Projects.show(include)).default_branch:
        return true;

      // If the version matches the latest tag, it is up to date.
      case await this.getProjectLatestTag(include):
        return true;

      default:
        return false;
    }
  }

  /**
   * Parse a component's URL into parts.
   *
   * @param {string} originalUrl
   *   The original component URL.
   *
   * @return {ParsedComponent | undefined}
   *   A parsed component object, or undefined on failure.
   *
   * @protected
   */
  protected parseComponentIncludeUrl(
    originalUrl: string,
  ): ParsedComponent | undefined {
    let url = originalUrl;
    // Component includes look like this:
    // "$CI_SERVER_FQDN/dxp/dat/gitlab-shared/php-unit/phpunit-module@~latest".
    // Start by removing the "$CI_SERVER_FQDN/" prefix from the URL.
    url = url.replace('$CI_SERVER_FQDN/', '');
    // Split with slashes.
    const url_parts = url.split('/');
    // The component name and version are the final segment, pop it off.
    const component = url_parts.pop();
    if (component === undefined) {
      return undefined;
    }
    // Break the component@version segment apart around the @ symbol.
    const component_parts = component.split('@');

    return {
      componentName: component_parts[0],
      componentVersion: component_parts[1],
      // Reassemble the URL. The final result should be just the project
      // name/path, like: "dxp/dat/gitlab-shared/php-unit".
      projectName: url_parts.join('/'),
    };
  }

  /**
   * Parse a GitLab CI YAML file to extract the included components or projects.
   *
   * @param {string | number} projectId
   *   A GitLab project ID.
   *
   * @return {Record<string, string>}
   *   A Record of the includes, where the keys are the project names, and the
   *   values are the included versions.
   *
   * @protected
   */
  protected async parseProjectCiIncludes(
    projectId: string | number,
  ): Promise<Record<string, string>> {
    // Initialize an empty Record.
    const includes: Record<string, string> = {};

    // Get and parse the CI file contents.
    const gitlab_project = await this.gitlab.Projects.show(projectId);
    const ci_file_contents = await this.gitlab.RepositoryFiles.showRaw(
      projectId,
      '.gitlab-ci.yml',
      gitlab_project.default_branch,
    );
    // If the file contents are not a string or are empty, return an empty
    // record.
    if (typeof ci_file_contents !== 'string' || ci_file_contents.length < 1) {
      return {};
    }
    // Parse the YAML.
    const ci_file = yamlParse(ci_file_contents);

    // If no includes are present, then the includes are not up-to-date. Return
    // an empty record.
    if (ci_file.include === undefined || ci_file.include.length < 1) {
      return {};
    }

    // Check each include to see if it is up-to-date.
    for (const include of ci_file.include) {
      // If the include is a component, parse the component's URL.
      if (include.component !== undefined) {
        const parsed_component = this.parseComponentIncludeUrl(
          include.component,
        );
        // If the component could not be parsed, skip it.
        if (parsed_component === undefined) {
          continue;
        }
        // Add the include to the record.
        includes[parsed_component.projectName] =
          parsed_component.componentVersion;
      }
      // The older style project type includes are much simpler to parse.
      else if (include.project !== undefined) {
        includes[include.project] = include.ref ?? null;
      }
    }

    return includes;
  }

  /**
   * Collect protected branches for a GitLab project.
   *
   * This should ideally be part of the main GitLab fact collector plugin,
   * but we’re implementing it here until then.
   *
   * @param {Entity} entity
   *   Entity.
   * @param {FactRef} factRef
   *   Fact ref.
   * @param {string | number} gitlabProjectId
   *   GitLab project ID.
   *
   * @return {Promise<Fact | undefined>}
   *   New fact, or undefined on failure.
   *
   * @protected
   */
  protected async collectProtectedBranches(
    entity: Entity,
    factRef: FactRef,
    gitlabProjectId: string | number,
  ): Promise<Fact | undefined> {
    try {
      // Get protected branches from the GitLab API
      const branches = await this.gitlab.ProtectedBranches.all(gitlabProjectId);

      if (!branches) {
        this.logger.error(
          `Unable to get protected branches for GitLab project ${gitlabProjectId}`,
        );
        return undefined;
      }

      return {
        factRef: factRef,
        entityRef: stringifyEntityRef(entity),
        data: {
          branches: branches.map(branch => ({
            name: branch.name,
            allow_force_push: branch.allow_force_push,
            code_owner_approval_required: branch.code_owner_approval_required,
          })),
        },
        timestamp: DateTime.utc().toISO(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch protected branches for project ${gitlabProjectId}: ${error}`,
      );
      return undefined;
    }
  }
}
