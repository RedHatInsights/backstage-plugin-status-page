import { AuthService, LoggerService } from '@backstage/backend-plugin-api';
import { Config } from '@backstage/config';
import { 
  deleteUserDataByPlatform, 
  fetchGDPRData, 
  fetchGDPRDataByUsername, 
  fetchGDPRDataByEmail 
} from '../../lib/client';
import { readDrupalConfig } from '../../lib/config';
import { 
  GdprConfig, 
  DeleteUserDataRequest, 
  DeleteResult,
  FetchUserDataByUsernameRequest,
  FetchUserDataByEmailRequest
} from '../../lib/types';
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
    fetchUserData: async (request: { id: string; email: string }) =>
      fetchGDPRData(drupalConfig, request.id, request.email, logger),

    fetchUserDataByUsername: async (request: FetchUserDataByUsernameRequest) => {
      logger.info('Fetching GDPR data by username only', { username: request.username, serviceNowTicket: request.serviceNowTicket });
      return fetchGDPRDataByUsername(drupalConfig, request.username, request.serviceNowTicket, logger);
    },

    fetchUserDataByEmail: async (request: FetchUserDataByEmailRequest) => {
      logger.info('Fetching GDPR data by email only', { email: request.email, serviceNowTicket: request.serviceNowTicket });
      return fetchGDPRDataByEmail(drupalConfig, request.email, request.serviceNowTicket, logger);
    },

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
