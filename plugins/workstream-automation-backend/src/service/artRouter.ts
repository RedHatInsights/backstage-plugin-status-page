import express from 'express';
import {
  AuthService,
  DiscoveryService,
  HttpAuthService,
  LoggerService,
  PermissionsService,
  RootConfigService,
} from '@backstage/backend-plugin-api';
import { ArtDatabaseStore } from '../database/ArtBackendDatabase';
import { CatalogApi } from '@backstage/catalog-client';
import {
  workstreamCreatePermission,
  workstreamDeletePermission,
  workstreamUpdatePermission,
} from '@appdev-platform/backstage-plugin-workstream-automation-common';
import { ConflictError, NotAllowedError } from '@backstage/errors';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import { v4 } from 'uuid';
import { ART } from '../types';
import { artToEntityKind } from '../modules/lib/utils';
import { DEFAULT_WORKSTREAM_NAMESPACE } from '../modules/lib/constants';

type ArtRouterOptions = {
  logger: LoggerService;
  config: RootConfigService;
  auth: AuthService;
  discovery: DiscoveryService;
  permissions: PermissionsService;
  httpAuth: HttpAuthService;
  artDatabaseClient: ArtDatabaseStore;
  catalogApi: CatalogApi;
};

const artRouter = async (options: ArtRouterOptions) => {
  const {
    discovery,
    artDatabaseClient,
    httpAuth,
    permissions,
    auth,
    catalogApi,
  } = options;
  const router = express.Router();
  const apiBaseUrl = `${await discovery.getBaseUrl('workstream')}/art`;

  router.get('/', async (_req, res) => {
    const result = await artDatabaseClient.listArts();
    res.status(200).json({ data: result });
  });

  router.post('/', async (req, res) => {
    const credentials = await httpAuth.credentials(req);
    const decision = (
      await permissions.authorize(
        [{ permission: workstreamCreatePermission }],
        { credentials: credentials },
      )
    )[0];
    if (decision.result === AuthorizeResult.DENY) {
      throw new NotAllowedError('Unauthorized');
    }
    if (!req.body.data) {
      res.status(400).json({ error: 'Request body incomplete' });
      return;
    }
    req.body.data.artId = v4();
    const artData: ART = req.body.data;

    if (await artDatabaseClient.getArtById(artData.name)) {
      throw new ConflictError(`Art ${artData.name} already exists`);
    }
    const result = await artDatabaseClient.insertArt(artData);
    const artLocation = `${apiBaseUrl}/${result.name}`;
    const catalogServiceToken = await auth.getPluginRequestToken({
      targetPluginId: 'catalog',
      onBehalfOf: await auth.getOwnServiceCredentials(),
    });
    await catalogApi.addLocation(
      {
        target: artLocation,
        type: 'url',
      },
      catalogServiceToken,
    );
    res.status(200).json({ data: result });
  });

  router.get('/:art_name/', async (req, res) => {
    const name = req.params.art_name;
    const result = await artDatabaseClient.getArtById(name);
    if (result) {
      const artEntity = artToEntityKind({
        data: result,
        location: `${apiBaseUrl}/${result.name}`,
        namespace: DEFAULT_WORKSTREAM_NAMESPACE,
      });
      return res.status(200).json(artEntity);
    }
    return res.status(404).json({
      error: 'ART not found',
    });
  });

  router.put('/:art_name', async (req, res) => {
    const artName = req.params.art_name;
    const credentials = await httpAuth.credentials(req);
    const decision = (
      await permissions.authorize(
        [
          {
            permission: workstreamUpdatePermission,
            resourceRef: `art:${DEFAULT_WORKSTREAM_NAMESPACE}/${artName}`,
          },
        ],
        { credentials },
      )
    )[0];
    if (decision.result === AuthorizeResult.DENY) {
      throw new NotAllowedError('Unauthorized');
    }
    if (!req.body.data) {
      return res.status(400).json({ error: 'Invalid data provided' });
    }
    const data: Partial<ART> = req.body.data;
    const originalData = await artDatabaseClient.getArtById(artName);
    if (originalData === null) {
      return res.status(404).json({ error: `${artName} ART not found` });
    }
    const updatedData: ART = {
      ...originalData,
      ...data,
    };
    const result = await artDatabaseClient.updateArt(artName, updatedData);
    if (result === null) {
      return res.status(500).json({
        error: 'Something went wrong while updating database',
      });
    }
    const catalogServiceToken = await auth.getPluginRequestToken({
      targetPluginId: 'catalog',
      onBehalfOf: await auth.getOwnServiceCredentials(),
    });
    if (artName !== updatedData.name) {
      // remove original location
      const currLoc = await catalogApi.getLocationByEntity(
        `art:${DEFAULT_WORKSTREAM_NAMESPACE}/${artName}`,
        catalogServiceToken,
      );
      await catalogApi.removeLocationById(
        currLoc?.id ?? '',
        catalogServiceToken,
      );
      // add new location with updated target name
      await catalogApi.addLocation(
        {
          type: 'url',
          target: `${apiBaseUrl}/${updatedData.name}`,
        },
        catalogServiceToken,
      );
      return res.status(200).json({
        data: result,
        message:
          'Workstream updated successfully (please refresh entity to view changes)',
      });
    }
    await catalogApi.refreshEntity(
      `art:${DEFAULT_WORKSTREAM_NAMESPACE}/${artName}`,
      catalogServiceToken,
    );
    return res.status(200).json({
      data: result,
      message:
        'Art updated successfully (please refresh entity to view changes)',
    });
  });

  router.delete('/:art_name', async (req, res) => {
    const credentials = await httpAuth.credentials(req);
    const decision = (
      await permissions.authorize(
        [{ permission: workstreamDeletePermission }],
        { credentials },
      )
    )[0];
    if (decision.result === AuthorizeResult.DENY) {
      throw new NotAllowedError('Unauthorized');
    }
    const name = req.params.art_name;
    const result = await artDatabaseClient.getArtById(name);
    if (result) {
      const catalogServiceToken = await auth.getPluginRequestToken({
        targetPluginId: 'catalog',
        onBehalfOf: await auth.getOwnServiceCredentials(),
      });

      const resp = await catalogApi.getLocationByRef(
        `url:${apiBaseUrl}/${result.name}`,
        catalogServiceToken,
      );
      if (resp) {
        await catalogApi.removeLocationById(resp.id, catalogServiceToken);
      }
      await artDatabaseClient.deleteArt(name);
      return res.status(200).json({ message: 'Deleted successfully' });
    }
    return res.status(404).json({
      error: 'workstream not found',
    });
  });

  return router;
};

export default artRouter;
