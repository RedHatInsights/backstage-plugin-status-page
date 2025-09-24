import { useEffect, useState } from 'react';
import { useApi, identityApiRef } from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { Entity } from '@backstage/catalog-model';

interface GdprAccessResult {
  hasAccess: boolean;
  loading: boolean;
  error?: string;
  userInfo?: {
    userId: string;
    entityRef: string;
    groups: string[];
  };
}

export const useGdprAccess = (): GdprAccessResult => {
  const catalogApi = useApi(catalogApiRef);
  const identityApi = useApi(identityApiRef);

  const [result, setResult] = useState<GdprAccessResult>({
    hasAccess: false,
    loading: true,
  });

  useEffect(() => {
    let isMounted = true;

    const checkAccess = async () => {
      try {
        const identity = await identityApi.getBackstageIdentity();
        const userEntityRef = identity.userEntityRef;

        const userEntity = await catalogApi.getEntityByRef(userEntityRef) as Entity;

        if (!userEntity) {
          if (isMounted) {
            setResult({
              hasAccess: false,
              loading: false,
              error: 'User entity not found in catalog',
            });
          }
          return;
        }

        const memberOfGroups = userEntity.relations
          ?.filter(relation => relation.type === 'memberOf')
          ?.map(relation => relation.targetRef) || [];

        // TODO: Implement proper access control based on required groups
        // const requiredGroupPatterns = ['compass-gdpr-admin', 'group:compass-gdpr-admin', 'group:redhat/compass-gdpr-admin'];
        // For now, allowing all authenticated users access
        const hasAccess = true;

        if (isMounted) {
          setResult({
            hasAccess,
            loading: false,
            userInfo: {
              userId: userEntityRef.split('/').pop() || '',
              entityRef: userEntityRef,
              groups: memberOfGroups,
            },
          });
        }

      } catch (error) {
        if (isMounted) {
          setResult({
            hasAccess: false,
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to check access',
          });
        }
      }
    };

    checkAccess();

    return () => {
      isMounted = false;
    };
  }, [catalogApi, identityApi]);

  return result;
};
