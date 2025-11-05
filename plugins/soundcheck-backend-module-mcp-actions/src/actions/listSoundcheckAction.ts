import { AuthService, DiscoveryService } from '@backstage/backend-plugin-api';
import { ActionsRegistryService } from '@backstage/backend-plugin-api/alpha';
import { SoundcheckClient } from '../api/soundcheckClient';
import { RESOURCE_TYPES } from '../utils/constants';

/**
 * Registers the MCP action to list Soundcheck checks and tracks
 */
export function createListSoundcheckAction({
  auth,
  discovery,
  actionsRegistry,
}: {
  auth: AuthService;
  discovery: DiscoveryService;
  actionsRegistry: ActionsRegistryService;
}) {
  actionsRegistry.register({
    name: 'list-soundcheck-info',
    title: 'Get Soundcheck Checks and Tracks',
    description: 'List available checks/tracks or get specific check/track details. Use this first to discover IDs when user provides human-readable names (e.g., "Catalog Health" → "catalog-health"). Types: checks, check, tracks, track.',
    schema: {
      input: (z) =>
        z.object({
          type: z
            .enum(['checks', 'check', 'tracks', 'track'])
            .describe('REQUIRED: Type of information to retrieve. Use "checks" to list all checks, "check" to get one specific check, "tracks" to list all tracks/programs, "track" to get one specific track.'),
          id: z
            .string()
            .describe('The name or ID of the specific check or track. REQUIRED when type is "check" or "track". Example: "has-readme" for checks, "production" for tracks.')
            .optional(),
          entityRef: z
            .string()
            .describe('Entity reference to filter applicable tracks/checks (optional, for tracks only). Example: "component:default/my-service".')
            .optional(),
          onlyApplicableChecks: z
            .boolean()
            .describe('Set to true to return only checks applicable to the given entity. Use with entityRef. Optional.')
            .optional(),
          tracks: z
            .array(z.string())
            .describe('Array of track IDs to filter when listing tracks. Example: ["production", "bronze"]. Optional.')
            .optional(),
        }),
      output: (z) =>
        z.object({
          checks: z.array(z.any()).optional(),
          check: z.any().optional(),
          tracks: z.array(z.any()).optional(),
          track: z.any().optional(),
          isError: z.boolean().optional(),
          error: z.string().optional(),
        }),
    },
    async action({ input, logger }) {
      try {
        logger.info(`Retrieving Soundcheck ${input.type} info`);
        
        const client = new SoundcheckClient(auth, discovery);

        switch (input.type) {
          case RESOURCE_TYPES.CHECKS: {
            const checks = await client.listChecks();
            return { output: { checks } };
          }

          case RESOURCE_TYPES.CHECK: {
            if (!input.id) throw new Error('"id" is required when type is "check"');
            const check = await client.getCheck(input.id);
            return { output: { check } };
          }
          
          case RESOURCE_TYPES.TRACKS: {
            const params = new URLSearchParams();
            if (input.tracks) params.append('tracks', input.tracks.join(','));
            if (input.entityRef) params.append('entityRef', input.entityRef);
            if (input.onlyApplicableChecks) params.append('onlyApplicableChecks', String(input.onlyApplicableChecks));
            
            const tracks = await client.listTracks(params);
            return { output: { tracks } };
          }

          case RESOURCE_TYPES.TRACK: {
            if (!input.id) throw new Error('"id" is required when type is "track"');
            
            const params = new URLSearchParams();
            if (input.entityRef) params.append('entityRef', input.entityRef);
            if (input.onlyApplicableChecks) params.append('onlyApplicableChecks', String(input.onlyApplicableChecks));
            
            const track = await client.getTrack(input.id, params);
            return { output: { track } };
          }
          
          default:
            throw new Error(`Unknown type: ${input.type}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`Soundcheck info retrieval failed: ${errorMessage}`);
        
        return {
          output: {
            isError: true,
            error: `Failed to retrieve Soundcheck info: ${errorMessage}`,
          },
        };
      }
    },
  });
}
