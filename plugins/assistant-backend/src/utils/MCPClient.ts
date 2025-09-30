import { MCPClient } from '@mastra/mcp';
import pkg from '../../package.json';

export async function getMCPClient(url: URL, token: string) {
  return new MCPClient({
    id: pkg.name,
    servers: {
      mcp: {
        url,
        requestInit: {
          headers: {
            Authorization: token,
          },
        },
      },
    },
  });
}
