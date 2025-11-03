import { AuthService } from '@backstage/backend-plugin-api';
import { ConflictError } from '@backstage/errors';
import { CatalogService } from '@backstage/plugin-catalog-node';
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import {
  DatasourceApiClient,
  stringifyDatasourceRef,
} from '@compass/backstage-plugin-datasource-common';

export const validateData = (options: {
  catalog: CatalogService;
  auth: AuthService;
  dataClient: DatasourceApiClient;
}) => {
  const { auth, catalog, dataClient } = options;
  return createTemplateAction({
    id: 'datasource:validate',
    description:
      'Validate the template data, Checks if datasource is already created and exists in catalog or not',
    examples: [],
    supportsDryRun: true,
    schema: {
      input: {
        name: z => z.string().describe('Slug for datasource entity'),
        title: z => z.string().describe('Human readable name of datasource'),
        namespace: z => z.string(),
      },
      output: {
        valid: z => z.boolean().describe('Return if the data is valid or not'),
        message: z => z.string().optional(),
      },
    },
    handler: async ctx => {
      const { input, logger } = ctx;

      // Check for duplicate name in database
      logger.info('Checking if datasource already exists in database...');
      const dbResp = await dataClient.getDatasource(
        { path: { name: input.name, namespace: input.namespace } },
        await auth.getPluginRequestToken({
          onBehalfOf: await auth.getOwnServiceCredentials(),
          targetPluginId: 'datasource',
        }),
      );
      if (dbResp.status === 200) {
        logger.error(
          `Datasource with same name is found in database, Aborting task.`,
        );
        ctx.output('valid', false);
        ctx.output(
          'message',
          `Datasource ${stringifyDatasourceRef(
            input,
          )} already exists, try again with a different name`,
        );
        throw new ConflictError(
          `Datasource ${stringifyDatasourceRef(
            input,
          )} already exists, try again with a different name`,
        );
      }
      logger.info('Datasource not found in database');

      // Check for entity in catalog
      logger.info('Checking if datasource entity already exists in catalog...');
      const catResp = await catalog.getEntityByRef(
        `resource:${stringifyDatasourceRef(input)}`,
        { credentials: await auth.getOwnServiceCredentials() },
      );
      if (catResp !== undefined) {
        logger.error(`Datasource entity found in catalog, Aborting task.`);
        ctx.output('valid', false);
        ctx.output(
          'message',
          `Datasource ${stringifyDatasourceRef(
            input,
          )} already exists, try again with a different name`,
        );
        throw new ConflictError(
          `Datasource ${stringifyDatasourceRef(
            input,
          )} already exists, try again with a different name`,
        );
      }
      logger.info(`Datasource "${stringifyDatasourceRef(input)}" is valid`);
      ctx.output('valid', true);
      ctx.output(
        'message',
        `Datasource ${stringifyDatasourceRef(input)} is valid`,
      );
    },
  });
};
