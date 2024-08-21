import { Entity } from '@backstage/catalog-model';
import { TableColumn } from '@backstage/core-components';
import { CatalogTableRow } from '@backstage/plugin-catalog';
import { columnFactories } from './columns';
import { DefaultEntityFilters } from '@backstage/plugin-catalog-react';
import { workstreamColumns } from '@appdev-platform/backstage-plugin-workstream-automation';

export const createTableColumnsFunc = (options: {
  entities: Entity[];
  filters: DefaultEntityFilters;
}) => {
  if (options.filters.kind?.value === 'workstream') {
    return workstreamColumns;
  }
  return [
    columnFactories.createTitleColumn({ hidden: true }),
    columnFactories.createNameColumn({
      defaultKind: options.filters.kind?.value,
    }),
    columnFactories.createDescriptionColumn(),
    ...createEntitySpecificColumns(),
    columnFactories.createTagColumn(),
    columnFactories.createActionColumn(),
  ];

  function createEntitySpecificColumns(): TableColumn<CatalogTableRow>[] {
    switch (options.filters.kind?.value) {
      case 'user':
        return [];
      case 'domain':
        return [columnFactories.createOwnerColumn()];
      case 'system':
        return [
          columnFactories.createOwnerColumn(),
          columnFactories.createAppcodeColumn(),
        ];
      case 'group':
      case 'template':
        return [
          columnFactories.createOwnerColumn(),
          columnFactories.createSpecTypeColumn(),
        ];
      case 'businessapplication':
        return [
          columnFactories.createOwnerColumn(),
          columnFactories.createAppcodeColumn(),
          columnFactories.createSpecLifecycleColumn(),
        ];
      case 'location':
        return [
          columnFactories.createOwnerColumn(),
          columnFactories.createSpecTypeColumn(),
          columnFactories.createSpecTargetsColumn(),
        ];
      default:
        return [
          columnFactories.createOwnerColumn(),
          columnFactories.createSystemColumn(),
          columnFactories.createSpecLifecycleColumn(),
          columnFactories.createAppcodeColumn(),
        ];
    }
  }
};
