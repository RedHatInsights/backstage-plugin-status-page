import {
  WorkstreamDataV1alpha1,
  workstreamUpdatePermission,
} from '@appdev-platform/backstage-plugin-workstream-automation-common';
import {
  HeaderActionMenu,
  InfoCard,
  InfoCardVariants,
  Progress,
  Table,
  TableColumn,
} from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import {
  catalogApiRef,
  EntityDisplayName,
  EntityRefLink,
  useAsyncEntity,
} from '@backstage/plugin-catalog-react';
import { makeStyles } from '@material-ui/core';
import EditTwoTone from '@material-ui/icons/EditTwoTone';
import React, { useEffect, useState } from 'react';
import { CustomUserEntity, TableRowDataType } from '../../types';
import { MembersEditModal } from './MembersEditModal';
import { RequirePermission } from '@backstage/plugin-permission-react';
import { stringifyEntityRef } from '@backstage/catalog-model';

const useStyles = makeStyles(theme => ({
  action: {
    '& $button $span': {
      color: theme.palette.text.primary,
    },
  },
}));

export const WorkstreamMembersCard = (props: { variant: InfoCardVariants }) => {
  const { entity, loading: isLoading } =
    useAsyncEntity<WorkstreamDataV1alpha1>();
  const classes = useStyles();
  const catalogApi = useApi(catalogApiRef);
  const members = entity?.spec.members;
  const [tableData, setTableData] = useState<TableRowDataType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (loading && members) {
      for (const member of members) {
        catalogApi.getEntityByRef(member.userRef).then(e => {
          if (e) {
            setTableData(t =>
              t.concat({
                role: member.role,
                user: e as CustomUserEntity,
              }),
            );
          }
        });
      }
      setLoading(false);
    }
  }, [catalogApi, members, loading]);

  useEffect(() => {
    if (isLoading) {
      setTableData([]);
      setLoading(true);
    } else setLoading(false);
  }, [isLoading]);

  const columns: TableColumn<TableRowDataType>[] = [
    {
      title: 'Name',
      field: 'user.spec.profile.displayName',
      defaultSort: 'asc',
      render: data => <EntityRefLink entityRef={data.user} />,
    },
    {
      title: 'Role',
      field: 'role',
      render: data => data.role,
    },
    {
      title: 'Manager',
      field: 'user.spec.manager',
      render: data => {
        return data.user.spec.manager ? (
          <EntityDisplayName hideIcon entityRef={data.user.spec.manager} />
        ) : (
          '-'
        );
      },
    },
  ];
  const [openEditModal, setOpenEditModal] = useState(false);

  return (
    <InfoCard
      {...props}
      title={`Members (${members ? members.length : 0})`}
      headerProps={{
        classes: { action: classes.action },
        action: (
          <RequirePermission
            permission={workstreamUpdatePermission}
            resourceRef={stringifyEntityRef(entity!)}
            errorPage={<></>}
          >
            <HeaderActionMenu
              actionItems={[
                {
                  label: 'Edit members',
                  icon: <EditTwoTone />,
                  onClick: () => setOpenEditModal(true),
                },
              ]}
            />
          </RequirePermission>
        ),
      }}
    >
      {openEditModal && (
        <MembersEditModal
          columns={columns}
          tableData={tableData}
          setEditModal={setOpenEditModal}
        />
      )}
      {!loading ? (
        <Table
          columns={columns}
          data={tableData}
          options={{
            padding: 'dense',
            toolbar: false,
            draggable: false,
          }}
        />
      ) : (
        <Progress />
      )}
    </InfoCard>
  );
};
