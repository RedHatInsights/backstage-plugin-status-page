import { coreServices, createBackendModule } from '@backstage/backend-plugin-api';
import { scaffolderActionsExtensionPoint } from '@backstage/plugin-scaffolder-node/alpha';
import { ScmIntegrations } from '@backstage/integration';
import { createGitlabForkAction } from './actions/gitlabRepoFork';
import { createGitlabCreateMrAction } from './actions/gitlabMergeRequestCreate';

/**
 * A backend module that registers GitLab custom actions into the scaffolder
 * 
 * @public
 */
export const scaffolderModule = createBackendModule({
  moduleId: 'gitlab-custom-actions',
  pluginId: 'scaffolder',
  register({ registerInit }) {
    registerInit({
      deps: {
        scaffolderActions: scaffolderActionsExtensionPoint,
        config: coreServices.rootConfig,
      },
      async init({ scaffolderActions, config }) {
        const integrations = ScmIntegrations.fromConfig(config);

        scaffolderActions.addActions(
          createGitlabForkAction({ integrations }),
          createGitlabCreateMrAction({ integrations }),
        );
      },
    });
  },
});

