import { useApi } from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { useAsync } from 'react-use';
import { Platform } from '../types';

export const usePlatforms = () => {
  const catalogApi = useApi(catalogApiRef);

  const { value: entities, loading, error } = useAsync(async () => {
    const response = await catalogApi.getEntities({
      filter: {
        'metadata.tags': ['ess', 'platform'],
      },
    });
    
    // Response already filtered by the API based on the filter criteria
    const filteredEntities = response.items;
    
    // Filtered ESS entities found

    // Transform entities to our Platform interface
    const platforms: Platform[] = filteredEntities.map(entity => ({
      name: entity.metadata.name,
      description: entity.metadata.description,
      owner: entity.spec?.owner as string,
      metadata: entity.metadata,
      spec: entity.spec,
      kind: entity.kind,
      namespace: entity.metadata.namespace || 'default',
    }));

    return platforms;
  }, []);

  return {
    platforms: entities || [],
    loading,
    error,
  };
};

export const usePlatform = (name: string) => {
  const { platforms, loading, error } = usePlatforms();
  
  // Decode URL encoded name and normalize
  const decodedName = decodeURIComponent(name).toLowerCase();
  
  const platform = platforms.find(p => {
    const platformName = p.name.toLowerCase();
    const platformTitle = (p.metadata.title || '').toLowerCase();
    
    // Match by metadata.name (primary key) or by title for backward compatibility
    return platformName === decodedName || platformTitle === decodedName;
  });

  return {
    platform,
    loading,
    error,
  };
};
