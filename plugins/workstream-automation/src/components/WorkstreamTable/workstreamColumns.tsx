/**
 * reference: https://github.com/backstage/backstage/blob/master/plugins/catalog/src/components/CatalogTable/columns.tsx
 */

import { Entity } from '@backstage/catalog-model';
import { Link, OverflowTooltip, TableColumn } from '@backstage/core-components';
import { CatalogTableRow } from '@backstage/plugin-catalog';
import {
  EntityRefLink,
  humanizeEntityRef,
  useStarredEntities,
} from '@backstage/plugin-catalog-react';
import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import BookmarkBorderTwoTone from '@material-ui/icons/BookmarkBorderTwoTone';
import BookmarkTwoTone from '@material-ui/icons/BookmarkTwoTone';
import React from 'react';
import { Member } from '../../types';
import { MembersColumn } from './MembersColumn';

const ActionIcons = (props: { entity: Entity }) => {
  const { entity } = props;
  const { isStarredEntity, toggleStarredEntity } = useStarredEntities();
  const isStarred = isStarredEntity(entity);

  return (
    <Box display="flex" justifyContent="center">
      <IconButton size="small" onClick={() => toggleStarredEntity(entity)}>
        {isStarred ? (
          <BookmarkTwoTone color="primary" />
        ) : (
          <BookmarkBorderTwoTone />
        )}
      </IconButton>
    </Box>
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
        return <EntityRefLink entityRef={entity} />;
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

  createLeadColumn(): TableColumn<CatalogTableRow> {
    return {
      title: 'Workstream Lead',
      field: 'entity.spec.lead',
      width: '18%',
      render: ({ entity }) =>
        entity.spec?.lead ? (
          <EntityRefLink entityRef={entity.spec.lead as string} />
        ) : (
          '-'
        ),
    };
  },
  createPillarColumn(): TableColumn<CatalogTableRow> {
    return {
      title: 'Pillar',
      field: 'entity.spec.pillar',
      width: '18%',
      render: ({ entity }) => <>{entity.spec?.pillar}</>,
    };
  },
  createJiraProjectKeyColumn(): TableColumn<CatalogTableRow> {
    return {
      title: 'JIRA Project',
      field: 'entity.metadata.annotations.jira/project-key',
      width: '18%',
      render: ({ entity }) =>
        entity.metadata?.annotations!['jira/project-key'] ? (
          <Link
            to={`https://issues.redhat.com/browse/${entity.metadata.annotations['jira/project-key']}`}
          >
            {entity.metadata.annotations['jira/project-key']}
          </Link>
        ) : (
          '-'
        ),
    };
  },
  createMembersColumn(): TableColumn<CatalogTableRow> {
    return {
      title: 'Members',
      sorting: false,
      width: '18%',
      render: ({ entity }) => (
        <MembersColumn members={entity.spec?.members as Member[]} />
      ),
    };
  },

  createActionsColumn(): TableColumn<CatalogTableRow> {
    return {
      title: '',
      sorting: false,
      align: 'left',
      width: '5%',
      render: data => <ActionIcons entity={data.entity} />,
    };
  },
});
