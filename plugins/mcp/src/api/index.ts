import { createApiRef } from '@backstage/core-plugin-api';

export const mcpApiRef = createApiRef<MCPServerApi>({
  id: 'mcp',
});

export class MCPServerApi {}
