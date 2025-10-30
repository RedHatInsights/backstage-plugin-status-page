/**
 * reference: https://github.com/backstage/backstage/blob/master/plugins/catalog/src/components/CatalogTable/columns.tsx
 */

import { Entity } from '@backstage/catalog-model';
import {
  AppIcon,
  OverflowTooltip,
  TableColumn,
} from '@backstage/core-components';
import { useApp } from '@backstage/core-plugin-api';
import { CatalogTableRow } from '@backstage/plugin-catalog';
import {
  EntityRefLink,
  EntityRefLinks,
  humanizeEntityRef,
  useStarredEntities,
} from '@backstage/plugin-catalog-react';
import { JsonArray } from '@backstage/types';
import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import { makeStyles, Theme } from '@material-ui/core/styles';
import { Tags } from './components/Tags';

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    display: 'inline-flex',
    alignItems: 'center',
  },
  icon: {
    marginRight: theme.spacing(2),
    color: theme.palette.text.secondary,
    lineHeight: 0,
  },
}));

const ActionIcon = (props: { entity: Entity }) => {
  const { entity } = props;
  const { isStarredEntity, toggleStarredEntity } = useStarredEntities();
  const isStarred = isStarredEntity(entity);
  return (
    <IconButton
      size="small"
      style={isStarred ? { color: '#F3BA37' } : {}}
      onClick={() => toggleStarredEntity(entity)}
    >
      {isStarred ? <AppIcon id="star" /> : <AppIcon id="unstarred" />}
    </IconButton>
  );
};

const TypeIcon = (props: { entity: Entity }) => {
  const classes = useStyles();
  const { entity } = props;
  const type = entity.spec?.type as string | undefined;
  const app = useApp();
  const Icon =
    app.getSystemIcon(`type:${type?.toLowerCase()}`) ??
    app.getSystemIcon(`kind:${entity.kind.toLowerCase()}`);

  return (
    <>
      {Icon ? (
        <Box component="span" className={classes.icon}>
          <Icon fontSize="small" />
        </Box>
      ) : null}
    </>
  );
};

export const columnFactories = Object.freeze({
  createTitleColumn(options?: {
    hidden?: boolean;
  }): TableColumn<CatalogTableRow> {
    return {
      title: 'Title',
      field: 'entity.metadata.title',
      hidden: options?.hidden,
      searchable: true,
      hiddenByColumnsButton: true,
      export: true,
    };
  },

  createNameColumn(options?: {
    defaultKind?: string;
  }): TableColumn<CatalogTableRow> {
    function formatContent(entity: Entity): string {
      return (
        entity.metadata?.title ??
        humanizeEntityRef(entity, {
          defaultKind: options?.defaultKind,
        })
      );
    }

    return {
      title: 'Name',
      field: 'resolved.entityRef',
      highlight: true,
      customSort({ entity: entity1 }, { entity: entity2 }) {
        return formatContent(entity1).localeCompare(formatContent(entity2));
      },
      render: ({ entity }) => {
        return (
          <Box
            component="span"
            style={{ display: 'inline-flex', alignItems: 'center' }}
          >
            <TypeIcon entity={entity} />
            <EntityRefLink
              entityRef={entity}
              defaultKind={options?.defaultKind ?? 'Component'}
              hideIcon
            />
          </Box>
        );
      },
      width: '20%',
    };
  },

  createDescriptionColumn(): TableColumn<CatalogTableRow> {
    return {
      title: 'Description',
      field: 'entity.metadata.description',
      render: ({ entity }) => (
        <OverflowTooltip
          text={entity.metadata.description}
          placement="bottom-start"
        />
      ),
      width: '40%',
    };
  },

  createOwnerColumn(): TableColumn<CatalogTableRow> {
    return {
      title: 'Owner',
      field: 'resolved.ownedByRelationsTitle',
      width: '15%',
      render: ({ resolved }) => (
        <EntityRefLinks entityRefs={resolved.ownedByRelations} />
      ),
    };
  },

  createSystemColumn(): TableColumn<CatalogTableRow> {
    return {
      title: 'System',
      width: '15%',
      field: 'resolved.partOfSystemRelationTitle',
      render: ({ resolved }) => (
        <EntityRefLinks
          entityRefs={resolved.partOfSystemRelations}
          defaultKind="system"
        />
      ),
    };
  },

  createSpecLifecycleColumn(): TableColumn<CatalogTableRow> {
    return {
      title: 'Lifecycle',
      width: 'auto',
      field: 'entity.spec.lifecycle',
    };
  },

  createAppcodeColumn(): TableColumn<CatalogTableRow> {
    return {
      title: 'Appcode',
      width: 'auto',
      field: 'entity.metadata.annotations["servicenow.com/appcode"]',
      render: ({ entity }) =>
        entity.metadata?.annotations!['servicenow.com/appcode'] ?? '-',
    };
  },

  createTagColumn(): TableColumn<CatalogTableRow> {
    return {
      title: 'Tags',
      field: 'entity.metadata.tags',
      width: '10%',
      cellStyle: {
        padding: '5px',
      },
      render: ({ entity }) => <Tags entity={entity} />,
    };
  },

  createActionColumn(): TableColumn<CatalogTableRow> {
    return {
      title: 'Actions',
      sorting: false,
      align: 'center',
      width: '5%',
      render: ({ entity }) => <ActionIcon entity={entity} />,
    };
  },
  createSpecTargetsColumn(): TableColumn<CatalogTableRow> {
    return {
      title: 'Targets',
      field: 'entity.spec.targets',
      customFilterAndSearch: (query, row) => {
        let targets: JsonArray = [];
        if (
          row.entity?.spec?.targets &&
          Array.isArray(row.entity?.spec?.targets)
        ) {
          targets = row.entity?.spec?.targets;
        } else if (row.entity?.spec?.target) {
          targets = [row.entity?.spec?.target];
        }
        return targets
          .join(', ')
          .toLocaleUpperCase('en-US')
          .includes(query.toLocaleUpperCase('en-US'));
      },
      render: ({ entity }) => (
        <>
          {(entity?.spec?.targets || entity?.spec?.target) && (
            <OverflowTooltip
              text={(
                (entity.spec.targets as JsonArray) || [entity.spec.target]
              ).join(', ')}
              placement="bottom-start"
            />
          )}
        </>
      ),
    };
  },
  createSpecTypeColumn(): TableColumn<CatalogTableRow> {
    return {
      title: 'Type',
      field: 'entity.spec.type',
    };
  },
});
