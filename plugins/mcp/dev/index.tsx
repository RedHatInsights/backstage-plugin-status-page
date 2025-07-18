import { createDevApp } from '@backstage/dev-utils';
import { EntityProvider } from '@backstage/plugin-catalog-react';
import { Grid } from '@material-ui/core';
import { MCPLinks, mcpPlugin, MCPPrimitives } from '../src/plugin';

const mockEntity = {
  apiVersion: 'mcp/v1beta1',
  kind: 'MCPServer',
  metadata: {
    name: 'example-mcp-server',
    namespace: 'example',
    title: 'Example MCP',
    annotations: {
      'gitlab.com/instance': 'gitlab.cee.redhat.com',
      'gitlab.com/project-slug': 'app-dev-platform/backstage-mcp-server',
    },
  },
  spec: {
    type: 'local',
    lifecycle: 'beta',
    owner: 'user:example/guest',
    primitives: [
      {
        type: 'tool',
        name: 'create_tickets',
        description: 'Create Support Tickets',
      },
      {
        type: 'resource',
        name: 'get_documentations',
        description: 'Get the documentation resources for a product',
      },
    ]
  }
}

createDevApp()
  .registerPlugin(mcpPlugin)
  .addPage({
    title: 'MCPServer Example',
    path: '/mcp-server',
    element: <EntityProvider entity={mockEntity}>
      <Grid item md={4}>
        <MCPLinks variant='gridItem' />
        <MCPPrimitives variant='gridItem' />
      </Grid>
    </EntityProvider>,
  })
  .render();
