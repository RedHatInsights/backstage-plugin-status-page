'use strict';

/**
 * List of fact names for the Red Hat GitLab fact collector.
 */
export enum FactNames {

  CodeCoverage = 'code_coverage',
  ComposerLockModified = 'composer_lock_modified',
  DrupalExtensionInfoFile = 'drupal_extension_info_file',
  Environments = 'environments',
  LatestCommit = 'latest_commit',
  LatestPipeline = 'latest_pipeline',
  MergeRequestApprovalRules = 'merge_request_approval_rules',
  RepositoryTree = 'repository_tree',
  SharedStages = 'shared_stages',

}
