import {
  ScmIntegrationsApi,
  scmIntegrationsApiRef,
  ScmAuth,
} from '@backstage/integration-react';
import {
  analyticsApiRef,
  AnyApiFactory,
  configApiRef,
  createApiFactory,
} from '@backstage/core-plugin-api';
import { MatomoAnalytics } from '@backstage-community/plugin-analytics-module-matomo';
import { DefaultEntityPresentationApi } from '@backstage/plugin-catalog';
import {
  entityPresentationApiRef,
  catalogApiRef,
} from '@backstage/plugin-catalog-react';
import GroupWorkIcon from '@material-ui/icons/GroupWork';
import AdbIcon from '@material-ui/icons/Adb';

export const apis: AnyApiFactory[] = [
  createApiFactory({
    api: scmIntegrationsApiRef,
    deps: { configApi: configApiRef },
    factory: ({ configApi }) => ScmIntegrationsApi.fromConfig(configApi),
  }),
  createApiFactory({
    api: analyticsApiRef,
    deps: { configApi: configApiRef },
    factory: ({ configApi }) => MatomoAnalytics.fromConfig(configApi),
  }),
  ScmAuth.createDefaultApiFactory(),
  createApiFactory({
    api: entityPresentationApiRef,
    deps: { catalogApiImp: catalogApiRef },
    factory: ({ catalogApiImp }) => {
      const kindIcons = { workstream: GroupWorkIcon, art: AdbIcon };
      return DefaultEntityPresentationApi.create({
        catalogApi: catalogApiImp,
        kindIcons,
      });
    },
  }),
];
