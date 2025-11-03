import { AuthService } from '@backstage/backend-plugin-api';
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import {
  DatasourceApiClient,
  createDatasourceParser,
  stringifyDatasourceRef,
} from '@compass/backstage-plugin-datasource-common';

import { stringifyEntityRef } from '@backstage/catalog-model';
import { createDatasourceExample } from './examples';

export const createDatasource = (options: {
  auth: AuthService;
  dataClient: DatasourceApiClient;
}) => {
  const { auth, dataClient } = options;
  return createTemplateAction({
    id: 'datasource:create',
    description: 'Create and register datasource.',
    examples: createDatasourceExample,
    schema: {
      input: () => createDatasourceParser,
      output: {
        entityRef: z => z.string(),
        message: z => z.string().optional(),
      },
    },
    supportsDryRun: true,
    handler: async ctx => {
      const { input, isDryRun, logger } = ctx;

      if (isDryRun) {
        logger.info(`Dry run detected, datasouce won't be created`);
        ctx.output(
          'entityRef',
          stringifyEntityRef({
            name: input.name,
            namespace: input.namespace,
            kind: 'resource',
          }),
        );
        ctx.output('message', 'Success');
        return;
      }

      try {
        logger.info(`Creating datasouce and registering in catalog`);
        const resp = await dataClient.addDatasource(
          { body: input },
          await auth.getPluginRequestToken({
            onBehalfOf: await auth.getOwnServiceCredentials(),
            targetPluginId: 'datasource',
          }),
        );
        if (resp.status > 300) {
          logger.error(`Error occured while creating datasource`);
          throw new Error('Error while creating datasource', {
            cause: await resp.json(),
          });
        }
        const data = await resp.json();
        logger.info(
          `Successfully created datasource entity: ${stringifyDatasourceRef({
            name: data.name,
            namespace: data.namespace,
          })}`,
        );
        ctx.output(
          'message',
          `Successfully created datasource entity: ${stringifyDatasourceRef({
            name: data.name,
            namespace: data.namespace,
          })}`,
        );
        ctx.output(
          'entityRef',
          stringifyEntityRef({
            kind: 'resource',
            name: data.name,
            namespace: data.namespace,
          }),
        );
      } catch (e: any) {
        logger.error('stack:', { stack: e });
        throw e;
      }
    },
  });
};
