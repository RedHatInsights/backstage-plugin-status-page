import {
  alertApiRef,
  configApiRef,
  RouteFunc,
  useApi,
  useRouteRef,
} from '@backstage/core-plugin-api';
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useEffect,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-use';
import { readRedirectionConfig } from '../config';
import { RedirectionRule } from '../types';
import { catalogRouteRef, techDocsRouteRef } from '../routes';
import {
  CompoundEntityRef,
  parseEntityRef,
  stringifyEntityRef,
} from '@backstage/catalog-model';
import { isMatch } from 'matcher';

export type RedirectsContextProps = {
  pathname?: string;
  rules?: RedirectionRule[];
  navigate: (newPath: string) => void;
};

export const RedirectsContext = createContext<
  RedirectsContextProps | undefined
>(undefined);

export const RedirectsProvider = (props: PropsWithChildren<{}>) => {
  const location = useLocation();
  const configApi = useApi(configApiRef);
  const alertApi = useApi(alertApiRef);
  const catalogRoute = useRouteRef(catalogRouteRef);
  const techDocsRoute = useRouteRef(techDocsRouteRef);
  const redirects = readRedirectionConfig(configApi);
  const navigate = useNavigate();

  const { rules } = redirects;

  const shouldRedirectUsingEntityRef = useCallback(
    (fromEntity: CompoundEntityRef) => {
      const entityPath = `${catalogRoute(fromEntity)}*`;
      const techDocsPath = `${techDocsRoute(fromEntity)}*`;

      return isMatch(location.pathname ?? '', [entityPath, techDocsPath]);
    },
    [catalogRoute, techDocsRoute, location.pathname],
  );

  const shouldRedirectUsingUrl = useCallback(
    (from: string) => {
      return isMatch(location.pathname ?? '', from);
    },
    [location.pathname],
  );

  const getPath = (
    route: RouteFunc<CompoundEntityRef>,
    entityRef: CompoundEntityRef,
  ) => {
    if (!route) {
      return '';
    }
    return route(entityRef);
  };

  const getNewPathForEntity = useCallback((currentPath: string | undefined, entity: CompoundEntityRef) => {
      const route = currentPath?.startsWith('/catalog')
        ? catalogRoute
        : techDocsRoute;

      return getPath(route, entity);
  }, [catalogRoute, techDocsRoute]);

  const validateEntityRef = (entityRef: string) => {
    try {
      return parseEntityRef(entityRef);
    } catch (err) {
      return null;
    }
  };

  useEffect(() => {
    const pathname = location.pathname;

    const applicableRule = rules.find(rule => {
      if (rule.type === 'url') {
        return shouldRedirectUsingUrl(rule.from);
      }

      if (rule.type === 'entity') {
        const fromEntity = validateEntityRef(rule.from);
        if (!fromEntity) {
          /* eslint-disable-next-line no-console */
          console.error(
            '[Redirects Plugin] Invalid entityRef in `from`:',
            rule.from,
          );
        } else {
          return shouldRedirectUsingEntityRef(fromEntity);
        }
      }
      return false;
    });

    if (!applicableRule) {
      return () => {};
    }

    const fromEntity = validateEntityRef(applicableRule.from);
    const toEntity = validateEntityRef(applicableRule.to);

    const newPath = toEntity
      ? getNewPathForEntity(pathname, toEntity)
      : applicableRule.to;

    const fromMessage = fromEntity
      ? stringifyEntityRef(fromEntity)
      : applicableRule.from;
    const toMessage = toEntity
      ? stringifyEntityRef(toEntity)
      : applicableRule.to;

    /* Don't redirect if newPath is null or the same as current path */
    if (!newPath || newPath === location.pathname) {
      return () => {};
    }

    const fallbackMessage = applicableRule.type === 'entity' ? `The entity ${fromMessage} has been replaced with ${toMessage}`
        : `The requested URL no longer exists, redirecting to ${toMessage}`;

    alertApi.post({
      message: `${
        applicableRule.message || fallbackMessage
      } | You will be redirected automatically in 5 seconds.`,
      display: 'transient',
      severity: 'info',
    });

    const delay = setTimeout(() => {
      navigate(newPath);
    }, 5000);

    return () => {
      /* Clear timeout if the hook is unloaded */
      clearTimeout(delay);
    };
  }, [
    location.pathname,
    alertApi,
    catalogRoute,
    getNewPathForEntity,
    techDocsRoute,
    navigate,
    rules,
    shouldRedirectUsingEntityRef,
    shouldRedirectUsingUrl,
  ]);

  const value: RedirectsContextProps = {
    pathname: location.pathname,
    rules,
    navigate,
  };

  return (
    <RedirectsContext.Provider value={value}>
      {props.children}
    </RedirectsContext.Provider>
  );
};
