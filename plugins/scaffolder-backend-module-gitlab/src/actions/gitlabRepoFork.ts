import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { ScmIntegrationRegistry } from '@backstage/integration';
import fetch from 'node-fetch';

/**
 * Custom action to fork a GitLab repository
 * 
 * This action:
 * 1. Forks the target repository to a specified namespace (group or user)
 * 2. Waits for the fork to be ready
 * 3. Returns fork information for subsequent actions
 */
export function createGitlabForkAction(options: {
  integrations: ScmIntegrationRegistry;
}) {
  const { integrations } = options;

  return createTemplateAction({
    id: 'gitlab:repo:fork',
    description: 'Forks a GitLab repository to a specified namespace',
    schema: {
      input: z =>
        z.object({
          repoUrl: z
            .string()
            .describe('GitLab repository to fork (format: gitlab.host/group/repo)'),
          targetNamespace: z
            .string()
            .describe('Target namespace (group or user) where the fork will be created'),
          name: z
            .string()
            .optional()
            .describe('Custom name for the forked repository (optional)'),
          token: z
            .string()
            .optional()
            .describe('The token to use for authorization to GitLab (treated as OAuth token)'),
        }),
      output: z =>
        z.object({
          forkUrl: z.string().describe('URL of the forked repository'),
          projectId: z.string().describe('GitLab project ID of the fork (as string for compatibility)'),
          projectPath: z.string().describe('GitLab project path of the fork (namespace/repo)'),
          owner: z.string().describe('Owner/namespace of the fork'),
          repo: z.string().describe('Repository name of the fork'),
          defaultBranch: z.string().describe('Default branch name of the forked repository'),
        }),
    },

    async handler(ctx) {
      const { repoUrl, targetNamespace, name, token: providedToken } = ctx.input;

      // Parse the repository URL
      const urlMatch = repoUrl.match(/^([^\/]+)\/(.+?)$/);
      if (!urlMatch) {
        throw new Error(`Invalid repoUrl format: ${repoUrl}. Expected format: host/group/repo`);
      }

      const [, host, projectPath] = urlMatch;
      const integration = integrations.gitlab.byHost(host);

      if (!integration) {
        throw new Error(`No GitLab integration found for host: ${host}`);
      }

      if (!providedToken) {
        throw new Error(`OAuth token is required. Please authenticate with GitLab first.`);
      }

      const token = providedToken;
            
      // Always use OAuth token (Bearer token)
      const authHeaders = {
        'Authorization': `Bearer ${token}`
      } as Record<string, string>;

      const apiBaseUrl = integration.config.apiBaseUrl || `https://${host}/api/v4`;
      const encodedProjectPath = encodeURIComponent(projectPath);

      ctx.logger.info(`Starting fork process for ${projectPath} using OAuth token`);

      // Step 1: Get the source project ID
      ctx.logger.info('Fetching source project information...');
      const projectResponse = await fetch(
        `${apiBaseUrl}/projects/${encodedProjectPath}`,
        {
          headers: authHeaders,
        }
      );

      if (!projectResponse.ok) {
        throw new Error(
          `Failed to fetch project: ${projectResponse.status} ${projectResponse.statusText}`
        );
      }

      const sourceProject = await projectResponse.json();
      const sourceProjectId = sourceProject.id;
      const defaultBranch = sourceProject.default_branch || 'main';

      ctx.logger.info(`Source project ID: ${sourceProjectId}, default branch: ${defaultBranch}`);

      // Step 2: Try to create the fork
      ctx.logger.info('Attempting to create fork...');
      const forkBody: any = {
        namespace: targetNamespace
      };
      
      ctx.logger.info(`Forking to namespace: "${targetNamespace}"`);
      
      if (name) {
        const sanitizedPath = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
        forkBody.name = name;
        forkBody.path = sanitizedPath;
        ctx.logger.info(`Forking with custom name: "${name}" → path: "${sanitizedPath}"`);
      }
      
      const forkResponse = await fetch(
        `${apiBaseUrl}/projects/${sourceProjectId}/fork`,
        {
          method: 'POST',
          headers: {
            ...authHeaders,
            'Content-Type': 'application/json',
          },
          body: Object.keys(forkBody).length > 0 ? JSON.stringify(forkBody) : undefined,
        }
      );

      let fork;
      let forkAlreadyExisted = false;
      
      if (forkResponse.ok) {
        // Fork created successfully
        fork = await forkResponse.json();
        ctx.logger.info(`✓ Fork created successfully at: ${fork.path_with_namespace}`);
      } else if (forkResponse.status === 409) {
        // Fork already exists (409 Conflict) - query for existing forks
        ctx.logger.info('Fork already exists (409 conflict), searching for existing fork...');
        
        // Get the list of forks for this source project owned by the authenticated user
        const forksResponse = await fetch(
          `${apiBaseUrl}/projects/${sourceProjectId}/forks?owned=true`,
          {
            headers: authHeaders,
          }
        );

        if (!forksResponse.ok) {
          throw new Error(
            `Failed to fetch existing forks: ${forksResponse.status} ${forksResponse.statusText}`
          );
        }

        const forks = await forksResponse.json();
        
        if (forks.length === 0) {
          const errorText = await forkResponse.text();
          throw new Error(
            `Fork already exists but could not be found. Error: ${errorText}. Please check your GitLab namespace for existing projects and delete any duplicates.`
          );
        }

        // Use the first fork owned by the authenticated user
        fork = forks[0];
        forkAlreadyExisted = true;
        ctx.logger.info(`✓ Found existing fork at: ${fork.path_with_namespace} - reusing it`);
          
        // Sync fork's default branch with upstream to get latest changes
        ctx.logger.info(`Checking if fork's '${defaultBranch}' branch is in sync with upstream...`);
        try {
          const upstreamBranch = defaultBranch;
          
          // Get upstream repository's latest commit
          const upstreamBranchResponse = await fetch(
            `${apiBaseUrl}/projects/${sourceProjectId}/repository/branches/${upstreamBranch}`,
            {
              headers: authHeaders,
            }
          );
          
          if (!upstreamBranchResponse.ok) {
            throw new Error(`Failed to fetch upstream branch: ${upstreamBranchResponse.status}`);
          }
          
          const upstreamBranchData = await upstreamBranchResponse.json();
          const upstreamCommitSha = upstreamBranchData.commit.id;
          
          // Get fork's current commit
          const forkBranchResponse = await fetch(
            `${apiBaseUrl}/projects/${fork.id}/repository/branches/${upstreamBranch}`,
            {
              headers: authHeaders,
            }
          );
          
          if (!forkBranchResponse.ok) {
            throw new Error(`Failed to fetch fork branch: ${forkBranchResponse.status}`);
          }
          
          const forkBranchData = await forkBranchResponse.json();
          const forkCommitSha = forkBranchData.commit.id;
          
          // Compare commits
          if (forkCommitSha !== upstreamCommitSha) {
            ctx.logger.info(`Fork's '${upstreamBranch}' branch is behind upstream. Fork: ${forkCommitSha.substring(0, 8)}, Upstream: ${upstreamCommitSha.substring(0, 8)}`);
            ctx.logger.info(`Syncing fork's '${upstreamBranch}' branch with upstream...`);
            
            // Create a sync commit by updating the default branch to match upstream
            const syncCommitResponse = await fetch(
              `${apiBaseUrl}/projects/${fork.id}/repository/branches/${upstreamBranch}`,
              {
                method: 'PUT',
                headers: {
                  ...authHeaders,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  ref: upstreamCommitSha,
                }),
              }
            );
            
            if (syncCommitResponse.ok) {
              ctx.logger.info(`✓ Fork ${upstreamBranch} branch synced to upstream commit ${upstreamCommitSha.substring(0, 8)}`);
            } else {
              const errorText = await syncCommitResponse.text();
              ctx.logger.warn(`Could not auto-sync fork (${syncCommitResponse.status}): ${errorText}`);
              ctx.logger.warn('⚠️ Fork may be out of sync. New branches will be based on fork\'s current state.');
              ctx.logger.info('💡 Tip: Manually sync via GitLab UI: Repository > Branches > Sync fork');
            }
          } else {
            ctx.logger.info(`✓ Fork's '${upstreamBranch}' branch is already up to date with upstream`);
          }
        } catch (syncError: any) {
          ctx.logger.warn(`Could not check/sync fork: ${syncError.message}`);
          ctx.logger.info('Fork will be used as-is. New branches will be based on fork\'s current state.');
        }
      } else {
        // Unexpected error
        const errorText = await forkResponse.text();
        throw new Error(`Failed to fork repository: ${forkResponse.status} ${errorText}`);
      }

      const forkProjectId = fork.id;
      const forkUrl = fork.web_url;
      const forkPath = fork.path_with_namespace;

      ctx.logger.info(`Fork details - ID: ${forkProjectId}, Path: ${forkPath}, URL: ${forkUrl}`);

      // Wait for fork to be ready (only if we just created it)
      let forkDefaultBranch = defaultBranch;
      
      if (forkAlreadyExisted) {
        ctx.logger.info('Using existing fork, skipping readiness check...');
        // Get the default branch from the existing fork
        const checkResponse = await fetch(
          `${apiBaseUrl}/projects/${forkProjectId}`,
          {
            headers: authHeaders,
          }
        );
        
        if (checkResponse.ok) {
          const forkProject = await checkResponse.json();
          forkDefaultBranch = forkProject.default_branch || defaultBranch;
        }
      } else {
        // New fork - wait for it to be ready (GitLab forks are async)
        ctx.logger.info('Waiting for new fork to be ready...');
        let attempts = 0;
        const maxAttempts = 30;
        let forkReady = false;

        while (attempts < maxAttempts && !forkReady) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
          
          const checkResponse = await fetch(
            `${apiBaseUrl}/projects/${forkProjectId}`,
            {
              headers: authHeaders,
            }
          );

          if (checkResponse.ok) {
            const forkProject = await checkResponse.json();
            if (forkProject.import_status === 'finished' || forkProject.import_status === 'none') {
              forkReady = true;
              forkDefaultBranch = forkProject.default_branch || defaultBranch;
              ctx.logger.info('Fork is ready!');
            } else {
              ctx.logger.info(`Fork import status: ${forkProject.import_status}, waiting...`);
            }
          }
          
          attempts++;
        }

        if (!forkReady) {
          throw new Error('Fork did not become ready in time');
        }
      }

      ctx.logger.info(`Fork completed: ${forkUrl}`);

      // Parse the fork path to extract owner and repo
      const [forkOwner, forkRepo] = forkPath.split('/');

      // Output fork information for use in subsequent actions
      ctx.output('forkUrl', forkUrl);
      ctx.output('projectId', forkProjectId.toString()); // Convert to string for compatibility with GitLab actions
      ctx.output('projectPath', forkPath);
      ctx.output('owner', forkOwner);
      ctx.output('repo', forkRepo);
      ctx.output('defaultBranch', forkDefaultBranch);
    },
  });
}



