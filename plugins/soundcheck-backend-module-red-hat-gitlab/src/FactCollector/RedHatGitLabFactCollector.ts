'use strict';

import {
  FactCollector,
} from '@spotify/backstage-plugin-soundcheck-node';
import {
  LoggerService,
  RootConfigService,
} from '@backstage/backend-plugin-api';
import {
  Entity,
  stringifyEntityRef,
} from '@backstage/catalog-model';
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
  TagSchema,
} from '@gitbeaker/core';
import {
  Gitlab,
} from '@gitbeaker/rest';
import {
  DateTime,
} from 'luxon';
import {
  parse as yamlParse,
} from 'yaml';
import {
  ParsedComponent,
} from "../types/ParsedComponent";
import {
  RequiredInclude,
} from "../types/RequiredInclude";

/**
 * Fact collector for facts not covered by the Spotify GitLab fact collector.
 */
export class RedHatGitLabFactCollector implements FactCollector {

  /** @inheritdoc */
  id: string = 'red-hat-gitlab';

  /** @inheritdoc */
  name: string = 'Red Hat GitLab';

  /** @inheritdoc */
  description: string = 'Collects GitLab facts not covered by the Spotify GitLab fact collector.';

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
   * Static factory method.
   *
   * @param {RootConfigService} config
   *   Root configuration service.
   * @param {LoggerService} logger
   *   Logger service.
   */
  public static create(
    config: RootConfigService,
    logger: LoggerService,
  ): RedHatGitLabFactCollector {
    const gitlabConfig = config.getOptionalConfigArray("integrations.gitlab") ?? []

    return new this(
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
   * @param {Gitlab} gitlab
   *   GitLab client.
   * @param {LoggerService} logger
   *   Logger service.
   */
  protected constructor(
    gitlab: GitlabCore,
    logger: LoggerService,
  ) {
    this.gitlab = gitlab;
    this.logger = logger.child({
      target: 'RedHatGitLabFactCollector',
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

    // Collect facts for each entity.
    for (const entity of entities) {
      const gitlabProjectId = entity.metadata.annotations?.['gitlab.com/project-slug'];
      // Skip this entity if the GitLab project information is missing.
      if (gitlabProjectId === undefined) {
        this.logger.warn(`Entity ${stringifyEntityRef(entity)} is missing the 'gitlab.com/project-slug' annotation in RedHatGitLabFactCollector.`);

        continue;
      }
      // Collect each fact.
      for (const factRef of params?.factRefs ?? []) {
        const parsedFactRef = parseFactRef(factRef);

        let fact: Fact | undefined;

        fact = undefined;

        switch (parsedFactRef.name) {
          case 'code_coverage':
            fact = await this.collectCodeCoverage(
              entity,
              factRef,
              gitlabProjectId,
            );
            break;

          case 'composer_lock_modified':
            fact = await this.collectComposerLockModified(
              entity,
              factRef,
              gitlabProjectId,
            );
            break;

          case 'environments':
            fact = await this.collectEnvironments(
              entity,
              factRef,
              gitlabProjectId,
            );
            break;

          case 'latest_pipeline':
            fact = await this.collectLatestPipeline(
              entity,
              factRef,
              gitlabProjectId,
            );
            break;

          case 'shared_stages':
            fact = await this.collectSharedStages(
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
    return [];
  }

  /** @inheritdoc */
  async getDataSchema(
    factRef: FactRef,
  ): Promise<string | undefined> {
    switch (factRef) {
      case 'code_coverage':
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

      case 'composer_lock_modified':
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

      case 'environments':
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
                  }
                },
              },
            },
          },
        });

      case 'latest_pipeline':
        return JSON.stringify({
          title: 'Latest pipeline',
          description: 'Information about the most recent successful pipeline, such as the jobs that ran.',
          type: 'object',
          properties: {
            jobs: {
              type: 'array',
              items: {
                type: 'string',
              }
            },
            pipeline_id: {
              type: [
                'string',
                'null',
              ],
            },
          },
        });

      case 'shared_stages':
        return JSON.stringify({
          title: 'Shared stages and includes status',
          description: 'Status of shared stages / includes. Mainly focuses on whether the shared stages are up-to-date. Using the special ~latest tag for Evergreen CI automatically counts as up-to-date.',
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
      'code_coverage',
      'composer_lock_modified',
      'environments',
      'latest_pipeline',
      'shared_stages',
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
    const pipeline = await this.getProjectLatestSuccessfulPipeline(gitlabProjectId);

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
    const modified_time = await this.getProjectComposerLockModified(gitlabProjectId);
    // If the file modification time was not found, skip this fact for
    // this entity.
    if (modified_time === undefined) {
      this.logger.info(`Unable to collect ${stringifyFactRef(factRef)}: unable to get modification time for composer.lock for GitLab project "${gitlabProjectId}" in RedHatGitLabFactCollector.`);

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
    const pipeline = await this.getProjectLatestSuccessfulPipeline(gitlabProjectId);
    // Initialize an empty array for jobs.
    let jobs: JobSchema[] = [];
    // If a pipeline was found, get the jobs for that pipeline.
    if (pipeline !== undefined) {
      jobs = await this.gitlab.Jobs.all(
        gitlabProjectId,
        {
          pipelineId: pipeline.id,
        },
      );
    }

    return {
      factRef: factRef,
      entityRef: stringifyEntityRef(entity),
      data: {
        // If no jobs were found, this callback will produce an empty array.
        jobs: jobs.map((job) => job.name),
        pipeline_id: pipeline?.id ?? null,
      },
      timestamp: DateTime.utc().toISO(),
    };
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
    }
    else {
      return undefined;
    }

    // Normalize includes from the YAML.
    const includes = await this.parseProjectCiIncludes(gitlabProjectId);

    // Using the ~latest version of the Evergreen component automatically counts
    // as up-to-date.
    if (includes['dxp/dat/gitlab-shared/evergreen-ci'] !== undefined && includes['dxp/dat/gitlab-shared/evergreen-ci'] === '~latest') {
      up_to_date = true;
    }
    // For each required include, check if it is up-to-date.
    else {
      for (const required_include of required_includes) {
        if (includes[required_include.name] === undefined) {
          required_include.upToDate = false;
        }
        else {
          required_include.upToDate = await this.isIncludeUpToDate(required_include.name, includes[required_include.name]);
        }
      }
      // Use Array.every() to check if every value in the array is true.
      up_to_date = required_includes.every(
        (required_include) => required_include.upToDate,
      );
    }

    return {
      factRef: factRef,
      entityRef: stringifyEntityRef(entity),
      data: {
        includes: includes,
        project_type: project_type,
        required_includes: required_includes.map((required_include) => required_include.name),
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

      // Throw an error if the file is undefined.
      if (file === undefined) {
        throw new Error('Unknown error while getting file');
      }

      // Get the file's latest commit.
      const commit = await this.gitlab.Commits.show(
        projectId,
        file.last_commit_id,
      );

      // Throw an error if either the commit or the committed date is undefined.
      if (commit?.committed_date === undefined) {
        throw new Error(`Unknown error while getting commit ${commit.id}`);
      }

      // Return the timestamp as a DateTime.
      return DateTime.fromISO(commit.committed_date);
    }
      // Handle exceptions with a log message and return undefined.
    catch (e) {
      this.logger.error(`Error while getting composer.lock file from GitLab repository ${projectId} in RedHatGitLabFactCollector: ${e}`);

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
    const pipelines = await this.gitlab.Pipelines.all(
      projectId,
      {
        orderBy: 'updated_at',
        ref: project.default_branch,
        status: 'success',
      },
    );

    // If no pipelines were found, log a message and return undefined.
    if (pipelines[0] === undefined) {
      this.logger.info(`No pipelines found for GitLab project ${projectId} in RedHatGitLabFactCollector.`);

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
      this.logger.error(`Unable to get pipeline ${pipelines[0].id} for GitLab project ${projectId} in RedHatGitLabFactCollector.`);

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
      const tags = await this.gitlab.Tags.all(
        projectId,
        {
          orderBy: 'version',
        },
      ) ?? [];
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
      case (await this.getProjectLatestTag(include)):
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
        const parsed_component = this.parseComponentIncludeUrl(include.component);
        // If the component could not be parsed, skip it.
        if (parsed_component === undefined) {
          continue;
        }
        // Add the include to the record.
        includes[parsed_component.projectName] = parsed_component.componentVersion;
      }
      // The older style project type includes are much simpler to parse.
      else if (include.project !== undefined) {
        includes[include.project] = include.ref ?? null;
      }
    }

    return includes;
  }

}
