import {
  ANNOTATION_LOCATION,
  ANNOTATION_ORIGIN_LOCATION,
  DEFAULT_NAMESPACE,
} from '@backstage/catalog-model';
import {
  MCPRegistryProviderConfig,
  MCPRegistryServer,
  MCPServerEntity,
} from '../types';
import { kebabCase } from 'lodash';
import merge from 'deepmerge';

/**
 * Transforms the given server and provider configuration into an Entity.
 *
 * @param server - The MCPRegistryServer object containing server details.
 * @param provider - The MCPRegistryProviderConfig object containing provider details.
 * @returns An Entity object representing the transformed server configuration.
 */
export function transform(
  server: MCPRegistryServer,
  provider: MCPRegistryProviderConfig,
): MCPServerEntity {
  const id = server.id.toString();
  const location = `url:https://${provider.host}/servers/${id}`;

  const mcpServer: MCPServerEntity = {
    apiVersion: 'mcp/v1beta1',
    kind: 'MCPServer',
    metadata: {
      name: kebabCase(server.name),
      namespace: DEFAULT_NAMESPACE,
      description: server.description,
      annotations: {
        [ANNOTATION_LOCATION]: location,
        [ANNOTATION_ORIGIN_LOCATION]: location,
        ...getGitAnnotations(server),
      },
    },
    spec: {
      type: 'local', // TODO: Identify if server is a local or remote
      version: server.version_detail?.version,
      packages: server.packages,
      remotes: server.remotes,
      /* TODO: Find a way to auto discovery all the primitives */
      primitives: [],
    },
  };

  const overrides = provider.overrides;

  return merge(mcpServer, overrides as MCPServerEntity);
}

/**
 * Retrieves Git annotations from a given MCPRegistryServer object.
 * @param {MCPRegistryServer} server - The MCPRegistryServer object containing repository details.
 * @returns {Record<string, string>} - An object with Git annotations.
 */
function getGitAnnotations(server: MCPRegistryServer): Record<string, string> {
  const annotations: Record<string, string> = {};
  const gitType = server.repository?.source;
  const url = server.repository?.url;

  if (gitType === 'github' && url) {
    const projectSlug = url.match(/github\.com\/([^/]+\/[^/]+)/)?.[1];
    annotations['github.com/project-slug'] = projectSlug || '';
  }
  if (gitType === 'gitlab' && url) {
    const gitlabUrl = new URL(url);
    const projectSlug = gitlabUrl.pathname
      .split('/')
      .slice(1)
      .join('/')
      .replace(/\/$/, '');
    annotations['gitlab.com/project-slug'] = projectSlug || '';
    annotations['gitlab.com/instance'] = gitlabUrl.host;
  }

  return annotations;
}
