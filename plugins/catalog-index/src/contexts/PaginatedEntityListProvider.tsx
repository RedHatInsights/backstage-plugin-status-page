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
import {
  DefaultEntityFilters,
  EntityFilter,
  catalogApiRef,
} from '@backstage/plugin-catalog-react';

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
  updatePageOptions: (update: Partial<PageOptions>) => void;

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
  pageOptions: PageOptions & {
    nextCursor?: string;
    prevCursor?: string;
  };
  totalCount: number;
};

/**
 * Provides entities and filters for a catalog listing with pagination using offset and limit
 * @public
 */
export const PaginatedEntityListProvider = <
  EntityFilters extends DefaultEntityFilters,
>(
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
  const [pageCursor, setPageCursor] = useState<string>();

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
      const previousTextFilter = outputState.appliedFilters.text;
      const textFilter = requestedFilters.text?.value;

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

      if (
        !isEqual(previousBackendFilter, backendFilter) ||
        !isEqual(previousPageOptions, pageOptions) ||
        !isEqual(previousTextFilter, textFilter)
      ) {
        const response = await catalogApi.queryEntities({
          filter: backendFilter,
          fullTextFilter: {
            term: textFilter ?? '',
            fields: [
              'metadata.name',
              'metadata.title',
              'metadata.description',
              'metadata.annotations.servicenow.com/appcode',
            ],
          },
          cursor: pageCursor,
          limit: pageOptions.rowsPerPage,
          orderFields: { field: 'metadata.name', order: 'asc' },
        });

        setOutputState({
          appliedFilters: requestedFilters,
          backendEntities: response.items,
          entities: response.items.filter(entityFilter),
          totalCount: response.totalItems,
          pageOptions: {
            ...pageOptions,
            ...response.pageInfo
          },
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

      /* HACK: If the filters are updated, reset the pagination to the first page */
      setPageCursor('');
      setPageOptions(prevOptions => ({ ...prevOptions, page: 0}));
    },
    [],
  );

  const updatePageOptions = useCallback((update: Partial<PageOptions>) => {
    if (update.page! < outputState.pageOptions.page) {
      setPageCursor(outputState.pageOptions.prevCursor);
    } else if (update.page! > outputState.pageOptions.page) {
      setPageCursor(outputState.pageOptions.nextCursor);
    }

    setPageOptions(prevPageOptions => ({ ...prevPageOptions, ...update }));
  }, [outputState.pageOptions]);

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
    [
      outputState,
      pageOptions,
      updatePageOptions,
      updateFilters,
      queryParameters,
      loading,
      error,
    ],
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
