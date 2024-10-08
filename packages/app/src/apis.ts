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
import { MatomoAnalytics } from '@janus-idp/backstage-plugin-analytics-module-matomo';
import { DefaultEntityPresentationApi } from '@backstage/plugin-catalog';
import {
  entityPresentationApiRef,
  catalogApiRef,
} from '@backstage/plugin-catalog-react';
import SettingsEthernet from '@material-ui/icons/SettingsEthernet';

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
      const kindIcons = { workstream: SettingsEthernet };
      return DefaultEntityPresentationApi.create({
        catalogApi: catalogApiImp,
        kindIcons,
      });
    },
  }),
];
