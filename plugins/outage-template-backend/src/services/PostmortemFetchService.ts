import { LoggerService } from '@backstage/backend-plugin-api';

import {
  draftPostmortem,
  publishPostmortem,
} from '../api';
import { PostmortemService } from './types';
import { PostmortemBody } from '../constants';

export async function PostmortemFetchService({
  logger,
  statusPageUrl,
  statusPageAuthToken,
}: {
  logger: LoggerService;
  statusPageUrl: string;
  statusPageAuthToken: string;
}): Promise<PostmortemService> {
  logger.info('Initializing PostmortemService');
  return {
    async draftPostmortem(id: string, postmortemBody: PostmortemBody) {
      return draftPostmortem(id, statusPageUrl, statusPageAuthToken, logger, postmortemBody);
    },
    async publishPostmortem(id: string, postmortemBody: PostmortemBody) {
        return publishPostmortem(id, statusPageUrl, statusPageAuthToken, logger, postmortemBody);
    }
  };
}
