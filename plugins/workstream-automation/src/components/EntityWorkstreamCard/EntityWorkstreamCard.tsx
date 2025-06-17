import {
  ArtEntity,
  artUpdatePermission,
  WorkstreamEntity,
} from '@appdev-platform/backstage-plugin-workstream-automation-common';
import {
  ErrorPanel,
  InfoCard,
  InfoCardVariants,
  Progress,
  Table,
  TableColumn,
} from '@backstage/core-components';
import {
  catalogApiRef,
  EntityDisplayName,
  EntityRefLink,
  useAsyncEntity,
} from '@backstage/plugin-catalog-react';
import React, { useEffect, useState } from 'react';
import { CustomUserEntity } from '../../types';
import {
  Entity,
  parseEntityRef,
  RELATION_MEMBER_OF,
  stringifyEntityRef,
} from '@backstage/catalog-model';
import { MembersColumn } from '../WorkstreamTable/MembersColumn';
import { useApi } from '@backstage/core-plugin-api';
import { WorkstreamEditModal } from './WorkstreamEditModal';
import { IconButton, makeStyles } from '@material-ui/core';
import EditTwoTone from '@material-ui/icons/EditTwoTone';
import { RequirePermission } from '@backstage/plugin-permission-react';

const useStyles = makeStyles(theme => ({
  action: {
    '& $button $span': {
      color: theme.palette.text.primary,
    },
  },
}));

export const EntityWorkstreamCard = (props: {
  variant?: InfoCardVariants;
  showRoleColumn?: boolean;
}) => {
  const { entity, loading: entityLoading } = useAsyncEntity<
    CustomUserEntity | ArtEntity | Entity
  >();
  const catalogApi = useApi(catalogApiRef);
  const [workstreams, setWorkstreams] = useState<WorkstreamEntity[]>([]);
  const [entitiesNotFound, setEntitiesNotFound] = useState<string[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const classes = useStyles();
  useEffect(() => {
    if (!entityLoading && entity) {
      const inWorkstreams = entity.relations?.filter(
        relation =>
          relation.type !== RELATION_MEMBER_OF &&
          parseEntityRef(relation.targetRef).kind === 'workstream',
      );
      inWorkstreams?.forEach(rel =>
        catalogApi
          .getEntityByRef(rel.targetRef)
          .then(res =>
            res
              ? setWorkstreams(ws => ws.concat(res as WorkstreamEntity))
              : setEntitiesNotFound(ws => ws.concat(rel.targetRef)),
          ),
      );
    } else {
      setWorkstreams([]);
      setEntitiesNotFound([]);
    }
  }, [catalogApi, entityLoading, entity]);

  const columns: TableColumn<WorkstreamEntity>[] = [
    {
      title: 'Name',
      field: 'metadata.name',
      highlight: true,
      render: data => <EntityRefLink entityRef={data} />,
    },
    {
      title: 'Role',
      tooltip: "Current user's role",
      hidden: !props.showRoleColumn,
      render: data => {
        if (data.spec.lead === stringifyEntityRef(entity!))
          return 'Workstream Lead';
        const member = data.spec.members.find(
          p => p.userRef === stringifyEntityRef(entity!),
        );
        return member?.role ?? '-';
      },
    },
    {
      title: 'Workstream Lead',
      field: 'spec.lead',
      tooltip: 'Workstream lead',
      render: data =>
        data.spec.lead ? (
          <EntityDisplayName entityRef={parseEntityRef(data.spec.lead)} />
        ) : (
          '-'
        ),
    },
    {
      title: 'Members',
      sorting: false,
      render: data => {
        return <MembersColumn members={data.spec.members} />;
      },
    },
  ];

  return entityLoading || entity === undefined ? (
    <Progress />
  ) : (
    <>
      {editModalOpen && (
        <WorkstreamEditModal
          workstreams={workstreams}
          open={editModalOpen}
          setEditModalOpen={setEditModalOpen}
          entitiesNotFound={entitiesNotFound}
        />
      )}
      <InfoCard
        {...props}
        title={`Workstreams (${workstreams?.length})`}
        noPadding
        headerProps={{
          classes: { action: classes.action },
          action: entity.kind === 'ART' && (
            <RequirePermission
              permission={artUpdatePermission}
              errorPage={<></>}
            >
              <IconButton onClick={() => setEditModalOpen(true)}>
                <EditTwoTone />
              </IconButton>
            </RequirePermission>
          ),
        }}
      >
        <Table
          columns={columns}
          style={{ borderRadius: 0, padding: 0 }}
          data={workstreams}
          isLoading={entityLoading}
          options={{
            draggable: false,
            padding: 'dense',
            pageSize: workstreams.length > 5 ? 10 : 5,
          }}
        />
        {entitiesNotFound.length > 0 && (
          <ErrorPanel
            error={{
              name: 'Missing workstreams',
              message: `Following workstreams are not found in catalog`,
              stack: ` - ${entitiesNotFound.join('\n - ')}`,
            }}
            title="Following workstreams are not found in catalog"
          />
        )}
      </InfoCard>
    </>
  );
};
