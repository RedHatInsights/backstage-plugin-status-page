import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { Entity } from '@backstage/catalog-model';
import { compact, isEqual } from 'lodash';
import qs from 'qs';
import { useLocation } from 'react-router-dom';
import useAsyncFn from 'react-use/lib/useAsyncFn';
import useDebounce from 'react-use/lib/useDebounce';
import useMountedState from 'react-use/lib/useMountedState';
import { reduceCatalogFilters, reduceEntityFilters } from '../utils/filters';
import { useApi } from '@backstage/core-plugin-api';
import { DefaultEntityFilters, EntityFilter, catalogApiRef } from '@backstage/plugin-catalog-react';

/** @public */
export type PageOptions = {
  page: number;
  rowsPerPage: number;
};

/** @public */
export type EntityListContextProps<
  EntityFilters extends DefaultEntityFilters = DefaultEntityFilters,
> = {
  /**
   * The currently registered filters, adhering to the shape of DefaultEntityFilters or an extension
   * of that default (to add custom filter types).
   */
  filters: EntityFilters;

  /**
   * The resolved list of catalog entities, after all filters are applied.
   */
  entities: Entity[];

  /**
   * The resolved list of catalog entities, after _only catalog-backend_ filters are applied.
   */
  backendEntities: Entity[];

  /**
   * Total Count of entities for the given filter
   */
  totalCount: number;

  /**
   * Page options for pagination
   */
  pageOptions: PageOptions;

  /**
   * Updates the pagination state
   * @param update Partial page options object
   */
  updatePageOptions: (update: Partial<PageOptions>) => void

  /**
   * Update one or more of the registered filters. Optional filters can be set to `undefined` to
   * reset the filter.
   */
  updateFilters: (
    filters:
      | Partial<EntityFilters>
      | ((prevFilters: EntityFilters) => Partial<EntityFilters>),
  ) => void;

  /**
   * Filter values from query parameters.
   */
  queryParameters: Partial<Record<keyof EntityFilters, string | string[]>>;

  loading: boolean;
  error?: Error;
};

/**
 * Creates new context for entity listing and filtering with pagination
 * @public
 */
export const PaginatedEntityListContext = createContext<
  EntityListContextProps<any> | undefined
>(undefined);

type OutputState<EntityFilters extends DefaultEntityFilters> = {
  appliedFilters: EntityFilters;
  entities: Entity[];
  backendEntities: Entity[];
  pageOptions: PageOptions;
  totalCount: number;
};

/**
 * Provides entities and filters for a catalog listing with pagination using offset and limit
 * @public
 */
export const PaginatedEntityListProvider = <EntityFilters extends DefaultEntityFilters>(
  props: PropsWithChildren<{}>,
) => {
  const isMounted = useMountedState();
  const catalogApi = useApi(catalogApiRef);
  const [requestedFilters, setRequestedFilters] = useState<EntityFilters>(
    {} as EntityFilters,
  );

  const [pageOptions, setPageOptions] = useState<PageOptions>({
    page: 0,
    rowsPerPage: 10,
  });

  const location = useLocation();
  const queryParameters = useMemo(
    () =>
      (qs.parse(location.search, {
        ignoreQueryPrefix: true,
      }).filters ?? {}) as Record<string, string | string[]>,
    [location],
  );

  const [outputState, setOutputState] = useState<OutputState<EntityFilters>>(
    () => {
      return {
        appliedFilters: {} as EntityFilters,
        entities: [],
        backendEntities: [],
        totalCount: 0,
        pageOptions,
      };
    },
  );

  const [{ loading, error }, refresh] = useAsyncFn(
    async () => {
      const compacted = compact(Object.values(requestedFilters));
      const entityFilter = reduceEntityFilters(compacted);
      const backendFilter = reduceCatalogFilters(compacted);
      const previousBackendFilter = reduceCatalogFilters(
        compact(Object.values(outputState.appliedFilters)),
      );
      const previousPageOptions = Object.assign({}, outputState.pageOptions);

      const queryParams = Object.keys(requestedFilters).reduce(
        (params, key) => {
          const filter = requestedFilters[key as keyof EntityFilters] as
            | EntityFilter
            | undefined;
          if (filter?.toQueryValue) {
            params[key] = filter.toQueryValue();
          }
          return params;
        },
        {} as Record<string, string | string[]>,
      );

      if (!isEqual(previousBackendFilter, backendFilter) || !isEqual(previousPageOptions, pageOptions)) {
        const response = await catalogApi.getEntities({
          filter: backendFilter,
          offset: pageOptions.page * pageOptions.rowsPerPage,
          limit: pageOptions.rowsPerPage,
          order: { field: 'metadata.name', order: 'asc' },
        });
        const {items: allItems} = await catalogApi.getEntities({
          filter: backendFilter,
        });

        setOutputState({
          appliedFilters: requestedFilters,
          backendEntities: response.items,
          entities: response.items.filter(entityFilter),
          totalCount: allItems.length,
          pageOptions,
        });
      } else {
        setOutputState({
          appliedFilters: requestedFilters,
          backendEntities: outputState.backendEntities,
          entities: outputState.backendEntities.filter(entityFilter),
          totalCount: outputState.totalCount,
          pageOptions: outputState.pageOptions,
        });
      }

      if (isMounted()) {
        const oldParams = qs.parse(location.search, {
          ignoreQueryPrefix: true,
        });
        const newParams = qs.stringify(
          { ...oldParams, filters: queryParams },
          { addQueryPrefix: true, arrayFormat: 'repeat' },
        );
        const newUrl = `${window.location.pathname}${newParams}`;
        window.history?.replaceState(null, document.title, newUrl);
      }
    },
    [catalogApi, queryParameters, requestedFilters, outputState, pageOptions],
    { loading: true },
  );

  useDebounce(refresh, 10, [requestedFilters, pageOptions]);

  const updateFilters = useCallback(
    (
      update:
        | Partial<EntityFilter>
        | ((prevFilters: EntityFilters) => Partial<EntityFilters>),
    ) => {
      setRequestedFilters(prevFilters => {
        const newFilters =
          typeof update === 'function' ? update(prevFilters) : update;
        return { ...prevFilters, ...newFilters };
      });
    },
    [],
  );

  const updatePageOptions = useCallback((update: Partial<PageOptions>) => {
    setPageOptions((prevPageOptions) => ({...prevPageOptions, ...update}));
  }, []);

  const value = useMemo(
    () => ({
      filters: outputState.appliedFilters,
      entities: outputState.entities,
      backendEntities: outputState.backendEntities,
      totalCount: outputState.totalCount,
      pageOptions,
      updatePageOptions,
      updateFilters,
      queryParameters,
      loading,
      error,
    }),
    [outputState, pageOptions, updatePageOptions, updateFilters, queryParameters, loading, error],
  );

  return (
    <PaginatedEntityListContext.Provider value={value}>
      {props.children}
    </PaginatedEntityListContext.Provider>
  );
};

export function usePaginatedEntityList() {
  const context = useContext(PaginatedEntityListContext);
  if (!context) {
    throw new Error(
      'usePaginatedEntityList must be used within PaginatedEntityListContext',
    );
  }
  return context;
}
