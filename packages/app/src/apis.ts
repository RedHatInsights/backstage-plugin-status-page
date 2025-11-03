import { MatomoAnalytics } from '@backstage-community/plugin-analytics-module-matomo';
import {
  analyticsApiRef,
  AnyApiFactory,
  configApiRef,
  createApiFactory,
} from '@backstage/core-plugin-api';
import {
  ScmAuth,
  ScmIntegrationsApi,
  scmIntegrationsApiRef,
} from '@backstage/integration-react';
import { DefaultEntityPresentationApi } from '@backstage/plugin-catalog';
import {
  catalogApiRef,
  entityPresentationApiRef,
} from '@backstage/plugin-catalog-react';
import { signalsPlugin } from '@backstage/plugin-signals';
import AdbIcon from '@material-ui/icons/Adb';
import GroupWorkIcon from '@material-ui/icons/GroupWork';

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
  ...signalsPlugin.getApis(),
];
