import { AuthService, DiscoveryService } from '@backstage/backend-plugin-api';
import { ActionsRegistryService } from '@backstage/backend-plugin-api/alpha';

/**
 * Registers the MCP action to list all available Scaffolder templates
 */
export function createListScaffolderTemplatesAction({
  auth,
  discovery,
  actionsRegistry,
}: {
  auth: AuthService;
  discovery: DiscoveryService;
  actionsRegistry: ActionsRegistryService;
}) {
  actionsRegistry.register({
    name: 'list-scaffolder-templates',
    title: 'List Scaffolder Templates',
    description:
      'List all available scaffolder templates in Backstage. Returns template information including names, descriptions, types, and owners. Use this to discover available software templates for project creation.',
    schema: {
      input: (z) =>
        z.object({
          dummy: z.any().optional().default(true).describe('No input required'),
        }).passthrough(),
      output: (z) =>
        z.object({
          templates: z.array(
            z.object({
              name: z.string(),
              namespace: z.string(),
              title: z.string().optional(),
              description: z.string().optional(),
              type: z.string(),
              owner: z.string().optional(),
              tags: z.array(z.string()).optional(),
            }),
          ),
          count: z.number(),
          isError: z.boolean().optional(),
          error: z.string().optional(),
        }),
    },
    async action({ logger }) {
      try {
        logger.info('Listing scaffolder templates');
        
        const { token } = await auth.getPluginRequestToken({
          onBehalfOf: await auth.getOwnServiceCredentials(),
          targetPluginId: 'scaffolder',
        });

        const baseUrl = await discovery.getBaseUrl('scaffolder');
        const url = `${baseUrl}/v2/templates`;

        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error(`API failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const items = Array.isArray(data) ? data : data?.items || [];

        const templates = items.map((t: any) => ({
          name: t?.metadata?.name || '',
          namespace: t?.metadata?.namespace || '',
          title: t?.metadata?.title || '',
          description: t?.metadata?.description || '',
          type: t?.spec?.type || '',
          owner: t?.spec?.owner || '',
          tags: t?.metadata?.tags || [],
        }));

        logger.info(`Retrieved ${templates.length} templates`);
        return { output: { templates, count: templates.length } };
      } catch (error) {
        const errorMsg = `Failed to list templates: ${error instanceof Error ? error.message : String(error)}`;
        logger.error(errorMsg);
        return { output: { templates: [], count: 0, isError: true, error: errorMsg } };
      }
    },
  });
}

