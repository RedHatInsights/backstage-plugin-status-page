import { EntityLink } from '@backstage/catalog-model';
import { ConfigApi, configApiRef, useApi } from '@backstage/core-plugin-api';
import { groupBy } from 'lodash';
import { MCPServerEntity, Package } from '../types';

export const useMCPLinks = (entity: MCPServerEntity | undefined) => {
  const config = useApi(configApiRef);

  if (!entity) return {};

  const groupedLinks = groupBy(entity.metadata.links || [], 'type');

  /* Get gitlab link from the MCPServer entity */
  const gitlabHost = entity.metadata.annotations?.['gitlab.com/instance'];
  const gitlabSlug = entity.metadata.annotations?.['gitlab.com/project-slug'];
  if (gitlabHost && gitlabSlug) {
    try {
      const gitlabUrl = new URL(gitlabSlug, `https://${gitlabHost}`).toString();

      const repositoryLinks = groupedLinks.repository || [];
      if (!repositoryLinks?.find(link => link.url.includes(gitlabUrl))) {
        groupedLinks.repository = [
          ...repositoryLinks,
          {
            url: gitlabUrl,
            icon: 'gitlab',
            title: gitlabSlug,
            type: 'repository',
          },
        ];
      }
    } catch (err) {
      /* eslint-disable-next-line no-console */
      console.error(err);
    }
  }

  /* Get Packages from spec.packages links from MCPServer Entity */
  const packageLinks = groupedLinks.package || [];
  (entity.spec.packages as Package[])?.forEach(pkg => {
    const registry = pkg.registry_name;
    const name = pkg.name;

    if (pkg.type === 'npm') {
      try {
        const url = registry.includes('nexus')
          ? getNexusUrl(registry, name)
          : getNPMUrl(registry, config, name);

        if (!packageLinks?.find(link => link.url.includes(url))) {
          groupedLinks.package = [
            ...packageLinks,
            {
              url,
              icon: 'npm',
              title: name,
              type: 'package',
            },
          ];
        }
      } catch (err) {
        /* eslint-disable-next-line no-console */
        console.error(err);
      }
    }

    /* TODO: Add urls for other package types */
  });

  return groupedLinks;
};

export function sortMCPLinks(groupedLinks: Record<string, EntityLink[]>) {
  const sortOrder = ['repository', 'package', 'documentation'];
  const sortedLinks = Object.entries(groupedLinks).sort(([a], [b]) => {
    const aIndex = sortOrder.indexOf(a.toLocaleLowerCase());
    const bIndex = sortOrder.indexOf(b.toLocaleLowerCase());
    return (
      (aIndex === -1 ? sortOrder.length : aIndex) -
      (bIndex === -1 ? sortOrder.length : bIndex)
    );
  });
  return sortedLinks;
}

function getNpmRegistryBaseUrl(registry: string, npmConfig?: ConfigApi) {
  if (!npmConfig) {
    return !registry.startsWith('https://') ? `https://${registry}` : registry;
  }

  const defaultRegistry = npmConfig.getOptionalString('defaultRegistry');
  const registries =
    npmConfig.get<{ name: string; url: string }[]>('registries');
  const registryConfig = registries.find(
    r => r.name === registry || r.name === defaultRegistry,
  );

  return registryConfig?.url;
}

function getNPMUrl(registry: string, config: ConfigApi, name: string) {
  const registryBaseUrl = getNpmRegistryBaseUrl(
    registry || 'npmjs.com',
    config.getOptionalConfig('npm'),
  );
  const npmUrl = new URL(`package/${name}`, registryBaseUrl);

  return npmUrl.toString();
}

function getNexusUrl(registry: string, name: string) {
  const registryHost = registry.startsWith('http')
    ? registry
    : `https://${registry}`;
  const pkgScope = name.startsWith('@') ? name.slice(1).split('/')[0] : undefined;
  const pkgName = name.startsWith('@')
    ? name.split('/').slice(1).join('/')
    : name;

  const baseUrl = new URL('/#browse/search/generic', registryHost).toString();

  const groupFilter = pkgScope
    ? encodeURIComponent(`group.raw=${pkgScope}`)
    : '';
  const nameFilter = encodeURIComponent(`name.raw=${pkgName}`);

  return `${baseUrl}=${groupFilter} AND ${nameFilter}`;
}
