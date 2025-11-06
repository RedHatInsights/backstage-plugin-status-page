import { AuthService, DiscoveryService } from '@backstage/backend-plugin-api';
import { ActionsRegistryService } from '@backstage/backend-plugin-api/alpha';
import { SearchClient } from '../api/searchClient';
import { buildSearchParams, formatError } from '../utils/helpers';

/**
 * Registers the MCP action to search Backstage catalog using the Search API
 * Provides full-text search across entities, documentation, and other indexed content
 */
export function createSearchCatalogAction({
  auth,
  discovery,
  actionsRegistry,
}: {
  auth: AuthService;
  discovery: DiscoveryService;
  actionsRegistry: ActionsRegistryService;
}) {
  actionsRegistry.register({
    name: 'search-catalog',
    title: 'Search Backstage Catalog',
    description: 'Full-text search across catalog entities and documentation. Use for fuzzy matching, partial names, keywords, or tags. For exact names use get-catalog-entity. For structured filtering use list-entities.',
    schema: {
      input: (z) =>
        z.object({
          term: z
            .string()
            .describe('REQUIRED: Search term or query string. Can be partial names, keywords, descriptions, or tags (e.g., "authentication service", "payment", "user management", "react"). Supports fuzzy matching.'),
          types: z
            .array(z.string())
            .describe('Optional: Filter by document types. Use ["software-catalog"] to search only entities, or omit to search everything.')
            .optional(),
          filters: z
            .record(z.string(), z.union([z.string(), z.array(z.string())]))
            .describe('Optional: Additional filters to narrow results. Common filters: "kind" (Component, System, API), "namespace" (default, production), "spec.lifecycle" (experimental, production, deprecated), "spec.owner" (team name). Format: {"kind": "Component", "spec.lifecycle": "production"}.')
            .optional(),
          limit: z
            .number()
            .min(1)
            .max(1000)
            .describe('Optional: Maximum number of results to return. Default: 100. For MCP usage, all relevant results are returned in a single response.')
            .optional(),
        }),
      output: (z) =>
        z.object({
          results: z.array(z.any()).optional(),
          totalCount: z.number().optional(),
          isError: z.boolean().optional(),
          error: z.string().optional(),
        }),
    },
    async action({ input, logger }) {
      try {
        logger.info(`Searching catalog with term: "${input.term}"`);
        
        const client = new SearchClient(auth, discovery);
        const params = buildSearchParams(input);
        
        const data = await client.search(params);
        const results = data.results || [];

        logger.info(`Found ${results.length} search results for term: "${input.term}"`);

        return {
          output: {
            results,
            totalCount: results.length,
          },
        };
      } catch (error) {
        const errorMessage = formatError(error);
        logger.error(`Search failed: ${errorMessage}`);
        
        return {
          output: {
            isError: true,
            error: `Failed to search catalog: ${errorMessage}`,
          },
        };
      }
    },
  });
}

