import { Entity } from "@backstage/catalog-model";
import { EntityFilter } from "@backstage/plugin-catalog-react";

export function reduceCatalogFilters(
  filters: EntityFilter[],
): Record<string, string | symbol | (string | symbol)[]> {
  return filters.reduce((compoundFilter, filter) => {
    return {
      ...compoundFilter,
      ...(filter.getCatalogFilters ? filter.getCatalogFilters() : {}),
    };
  }, {} as Record<string, string | symbol | (string | symbol)[]>);
}

export function reduceEntityFilters(
  filters: EntityFilter[],
): (entity: Entity) => boolean {
  return (entity: Entity) =>
    filters.every(
      filter => !filter.filterEntity || filter.filterEntity(entity),
    );
}
