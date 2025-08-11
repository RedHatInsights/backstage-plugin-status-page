import { AuthService, LoggerService } from '@backstage/backend-plugin-api';
import { Config } from '@backstage/config';
import { deleteUserDataByPlatform, fetchGDPRData } from '../../lib/client';
import { readDrupalConfig } from '../../lib/config';
import { GdprConfig, DeleteUserDataRequest, DeleteResult } from '../../lib/types';
import { DrupalService } from './types';

export async function drupalService({
  logger,
  config,
}: {
  auth: AuthService;
  logger: LoggerService;
  config: Config;
}): Promise<DrupalService> {
  logger.info('Initializing DrupalService');
  const drupalConfig: GdprConfig = await readDrupalConfig(config);
  return {
    fetchUserData: async (request: { id: string }) =>
      fetchGDPRData(drupalConfig, request.id, logger),

    deleteUserData: async (requests: DeleteUserDataRequest[]): Promise<DeleteResult[]> => {
      logger.info(`Incoming requests: ${requests}`);
      const results = await Promise.all(
        requests.map(async (request): Promise<DeleteResult> => {
          try {
            const res = await deleteUserDataByPlatform(drupalConfig, request.uid, request.platform, logger);
            return {
              uid: request.uid,
              platform: request.platform,
              success: true,
              data: res,
            };
          } catch (error: unknown) {
            return {
              uid: request.uid,
              platform: request.platform,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            };
          }
        })
      );

      return results;
    },
  };
}
