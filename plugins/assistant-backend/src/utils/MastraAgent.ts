import { DiscoveryService, RootConfigService } from '@backstage/backend-plugin-api';
import { getMCPClient } from './MCPClient';
import { Agent } from '@mastra/core';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import _ from 'lodash';

interface AgentConfig {
  authToken?: string;
  discoveryApi: DiscoveryService;
  rootConfig: RootConfigService;
  selectedTools: {id: string}[];
}

export async function getAgent({
  authToken,
  discoveryApi,
  rootConfig,
  selectedTools,
}: AgentConfig) {
  const assistantConfig = rootConfig.getConfig('assistant');

  const baseUrl = await discoveryApi.getBaseUrl('mcp-actions');
  const mcpVersion = assistantConfig.getOptionalString('mcpActionsVersion') ?? 'v1';
  const url = new URL(`${baseUrl}/${mcpVersion}`);

  const mcpClient = await getMCPClient(url, authToken ?? '');
  const tools = await mcpClient.getTools();

  const modelId = assistantConfig.getString('llmOptions.modelId');
  const modelUrl = assistantConfig.getString('llmOptions.url');
  const modelApiKey = assistantConfig.getOptionalString('llmOptions.apiKey');

  const model = createOpenAICompatible({
    baseURL: modelUrl,
    apiKey: modelApiKey,
    name: modelId,
    includeUsage: true,
  });

  const agent = new Agent({
    name: 'Smart Assistant',
    instructions:
      `A smart assistant that can answer questions about any entities from the Backstage Catalog.
      You should keep the responses short and concise and avoid mentioning any internal tool names to the user.
      In case of any issues or errors, you should point the users to the slack channel [#forum-xe-compass](https://redhat.enterprise.slack.com/archives/C05DM3PBLRG).`,
    model: model.chatModel(modelId),
    tools:
      selectedTools?.length > 0
        ? _.pick(
            tools,
            selectedTools.map(tool => tool.id),
          )
        : tools,
  });

  return agent;
}
