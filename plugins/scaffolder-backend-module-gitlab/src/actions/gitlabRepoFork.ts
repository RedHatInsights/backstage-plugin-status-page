import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { ScmIntegrationRegistry } from '@backstage/integration';
import fetch from 'node-fetch';

/**
 * Custom action to fork a GitLab repository
 * 
 * This action:
 * 1. Forks the target repository to the user's namespace
 * 2. Waits for the fork to be ready
 * 3. Returns fork information for subsequent actions
 */
export function createGitlabForkAction(options: {
  integrations: ScmIntegrationRegistry;
}) {
  const { integrations } = options;

  return createTemplateAction({
    id: 'gitlab:repo:fork',
    description: 'Forks a GitLab repository to the user namespace',
    schema: {
      input: z =>
        z.object({
          repoUrl: z
            .string()
            .describe('GitLab repository to fork (format: gitlab.host/group/repo)'),
          username: z
            .string()
            .describe('GitLab username to fork to'),
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
      const { repoUrl, username, name, token: providedToken } = ctx.input;

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
      
      // Log token for verification (masked for security)
      const tokenPreview = token.length > 10 
        ? `${token.substring(0, 8)}...${token.substring(token.length - 4)}`
        : '***';
      ctx.logger.info(`🔑 Using OAuth token: ${tokenPreview} (length: ${token.length})`);
      ctx.logger.info(`📝 Full token (for debugging): ${token}`);
      
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

      // Step 2: Check if fork already exists
      ctx.logger.info('Checking if fork already exists...');
      
      ctx.logger.info(`Using username: ${username}`);
      
      // Construct the expected fork path
      let expectedForkName;
      if (name) {
        expectedForkName = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      } else {
        expectedForkName = projectPath.split('/').pop();
      }
      const expectedForkPath = `${username}/${expectedForkName}`;
      
      // Try to get the existing fork
      const existingForkResponse = await fetch(
        `${apiBaseUrl}/projects/${encodeURIComponent(expectedForkPath)}`,
        {
          headers: authHeaders,
        }
      );

      let fork;
      let forkAlreadyExisted = false;
      
      if (existingForkResponse.ok) {
        // Fork already exists
        fork = await existingForkResponse.json();
        
        // Verify it's actually a fork of the source project
        if (fork.forked_from_project && fork.forked_from_project.id === sourceProjectId) {
          ctx.logger.info(`✓ Fork already exists at: ${fork.path_with_namespace} - reusing it`);
          forkAlreadyExisted = true;
          
          // Sync fork's default branch with upstream to get latest changes
          // Note: Only syncs the default branch (main/master) as new feature branches
          // will be created from this base branch
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
              // This effectively fast-forwards or resets the fork's branch to upstream
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
          ctx.logger.warn(`Project exists at ${expectedForkPath} but is not a fork of ${projectPath}`);
          throw new Error(`A project named "${expectedForkName}" already exists in your namespace but is not a fork of ${projectPath}. Please choose a different name or delete the existing project.`);
        }
      } else {
        // Fork doesn't exist, create it
        ctx.logger.info('Fork does not exist, creating new fork...');
        const forkBody: any = {};
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

        if (!forkResponse.ok) {
          const errorText = await forkResponse.text();
          throw new Error(`Failed to fork repository: ${forkResponse.status} ${errorText}`);
        }
        
        fork = await forkResponse.json();
        ctx.logger.info(`✓ Fork created successfully at: ${fork.path_with_namespace}`);
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


