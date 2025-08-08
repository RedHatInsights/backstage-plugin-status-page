import { LoggerService } from '@backstage/backend-plugin-api';

import { draftPostmortem, publishPostmortem } from '../api';
import { PostmortemServiceType } from './types';
import { PostmortemBody } from '../constants';

export async function PostmortemFetchService({
  logger,
  statusPageUrl,
  statusPageAuthToken,
}: {
  logger: LoggerService;
  statusPageUrl: string;
  statusPageAuthToken: string;
}): Promise<PostmortemServiceType> {
  logger.info('Initializing PostmortemService');
  return {
    async draftPostmortem(
      id: string,
      postmortemBody: PostmortemBody,
      cookie: any,
    ) {
      return draftPostmortem(
        id,
        statusPageUrl,
        statusPageAuthToken,
        logger,
        postmortemBody,
        cookie,
      );
    },
    async publishPostmortem(
      id: string,
      postmortemBody: PostmortemBody,
      cookie: any,
    ) {
      return publishPostmortem(
        id,
        statusPageUrl,
        statusPageAuthToken,
        logger,
        postmortemBody,
        cookie,
      );
    },
  };
}
