import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { ScmIntegrationRegistry } from '@backstage/integration';
import fetch from 'node-fetch';

/**
 * Custom action to create a GitLab Merge Request from a fork to upstream
 * 
 * This action creates an MR from a branch in a forked repository to the upstream repository
 */
export function createGitlabCreateMrAction(options: {
  integrations: ScmIntegrationRegistry;
}) {
  const { integrations } = options;

  return createTemplateAction({
    id: 'gitlab:create-mr-upstream',
    description: 'Creates a GitLab Merge Request from a fork to upstream repository',
    schema: {
      input: z =>
        z.object({
          repoUrl: z
            .string()
            .describe('Upstream GitLab repository (format: gitlab.host/group/repo)'),
          sourceBranch: z
            .string()
            .describe('Source branch name in the fork'),
          targetBranch: z
            .string()
            .describe('Target branch name in upstream'),
          title: z
            .string()
            .describe('Merge Request title'),
          description: z
            .string()
            .optional()
            .describe('Merge Request description'),
          forkProjectId: z
            .string()
            .describe('GitLab project ID of the fork'),
          token: z
            .string()
            .optional()
            .describe('The token to use for authorization to GitLab (treated as OAuth token)'),
        }),
      output: z =>
        z.object({
          mergeRequestUrl: z.string().describe('URL of the created merge request'),
          mergeRequestIid: z.string().describe('Internal ID of the merge request'),
        }),
    },

    async handler(ctx) {
      const { repoUrl, sourceBranch, targetBranch, title, description, forkProjectId, token: providedToken } = ctx.input;

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

      ctx.logger.info(`Creating MR from fork ${forkProjectId} to upstream ${projectPath} using OAuth token`);

      // Step 1: Get the upstream project ID
      const upstreamProjectResponse = await fetch(
        `${apiBaseUrl}/projects/${encodedProjectPath}`,
        {
          headers: authHeaders,
        }
      );

      if (!upstreamProjectResponse.ok) {
        throw new Error(`Failed to fetch upstream project: ${upstreamProjectResponse.status} ${await upstreamProjectResponse.text()}`);
      }

      const upstreamProject = await upstreamProjectResponse.json();
      const upstreamProjectId = upstreamProject.id;

      ctx.logger.info(`Upstream project ID: ${upstreamProjectId}`);

      // Step 2: Create the merge request from fork to upstream
      const mrData = {
        source_branch: sourceBranch,
        target_branch: targetBranch,
        target_project_id: upstreamProjectId,
        title: title,
        description: description || '',
      };

      ctx.logger.info(`Creating MR with data: ${JSON.stringify(mrData)}`);

      const createMrResponse = await fetch(
        `${apiBaseUrl}/projects/${forkProjectId}/merge_requests`,
        {
          method: 'POST',
          headers: {
            ...authHeaders,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mrData),
        }
      );

      if (!createMrResponse.ok) {
        const errorText = await createMrResponse.text();
        throw new Error(`Failed to create merge request: ${createMrResponse.status} ${errorText}`);
      }

      const mr = await createMrResponse.json();
      const mergeRequestUrl = mr.web_url;
      const mergeRequestIid = mr.iid.toString();

      ctx.logger.info(`Merge Request created: ${mergeRequestUrl}`);

      // Output MR information
      ctx.output('mergeRequestUrl', mergeRequestUrl);
      ctx.output('mergeRequestIid', mergeRequestIid);
    },
  });
}


