import {
  DiscoveryService,
  RootConfigService,
} from '@backstage/backend-plugin-api';
import { getMCPClient } from './MCPClient';
import { Agent } from '@mastra/core/agent';
import { UnicodeNormalizer } from '@mastra/core/processors';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import _ from 'lodash';
import { getDefaultAssistantOptions } from './defaultAssistantOptions';

interface AgentConfig {
  authToken?: string;
  discoveryApi: DiscoveryService;
  rootConfig: RootConfigService;
  selectedTools: { id: string }[];
}

export async function getAgent({
  authToken,
  discoveryApi,
  rootConfig,
  selectedTools,
}: AgentConfig) {
  const assistantConfig = rootConfig.getConfig('assistant');

  const baseUrl = await discoveryApi.getBaseUrl('mcp-actions');
  const mcpVersion =
    assistantConfig.getOptionalString('mcpActionsVersion') ?? 'v1';
  const url = new URL(`${baseUrl}/${mcpVersion}`);

  const mcpClient = await getMCPClient(url, authToken ?? '');
  const tools = await mcpClient.getTools();

  const modelId = assistantConfig.getString('llmOptions.modelId');
  const modelUrl = assistantConfig.getString('llmOptions.url');
  const modelApiKey = assistantConfig.getOptionalString('llmOptions.apiKey');

  const assistantOptions = assistantConfig.getOptionalConfig('assistantOptions');
  const defaultAssistantOptions = getDefaultAssistantOptions(rootConfig);

  const model = createOpenAICompatible({
    baseURL: modelUrl,
    apiKey: modelApiKey,
    name: modelId,
    includeUsage: true,
  });

  const agent = new Agent({
    name: assistantOptions?.getOptionalString('name') ?? defaultAssistantOptions.name,
    instructions: assistantOptions?.getOptionalString('instructions') ?? defaultAssistantOptions.instructions,
  
    model: model(modelId),

    tools:
      selectedTools?.length > 0
        ? _.pick(
            tools,
            selectedTools.map(tool => tool.id),
          )
        : tools,

    inputProcessors: [
      new UnicodeNormalizer({
        trim: true,
        collapseWhitespace: true,
        preserveEmojis: true,
      }),
    ],

    defaultStreamOptions: {
      providerOptions: {
        openai: {
          reasoningEffort: 'low',
        },
      },
      topP: 0.4,
    },
  });

  return agent;
}
