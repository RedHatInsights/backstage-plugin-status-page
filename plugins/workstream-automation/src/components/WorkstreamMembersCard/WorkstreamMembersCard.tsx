import {
  WorkstreamDataV1alpha1,
  workstreamUpdatePermission,
} from '@appdev-platform/backstage-plugin-workstream-automation-common';
import {
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
import { IconButton, makeStyles } from '@material-ui/core';
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
  const leadRef = entity?.spec.lead;
  const [leadEntity, setLeadEntity] = useState<CustomUserEntity>();
  const [tableData, setTableData] = useState<TableRowDataType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (loading && members) {
      const getMemberEntites = async () => {
        const tempArr: TableRowDataType[] = [];
        if (leadRef) {
          const resp = await catalogApi.getEntityByRef(leadRef);
          if (resp) setLeadEntity(resp as CustomUserEntity);
        }
        for (const member of members) {
          const resp = await catalogApi.getEntityByRef(member.userRef);
          if (resp) {
            tempArr.push({
              role: member.role,
              user: resp as CustomUserEntity,
            });
          }
        }
        setTableData(tempArr);
        setLoading(false);
      };
      getMemberEntites();
    }
  }, [catalogApi, members, loading, leadRef]);

  useEffect(() => {
    if (isLoading) {
      setTableData([]);
      setLoading(true);
    }
  }, [isLoading]);

  const columns: TableColumn<TableRowDataType>[] = [
    {
      title: 'Name',
      field: 'user.spec.profile.displayName',
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
            <IconButton onClick={() => setOpenEditModal(true)}>
              <EditTwoTone />
            </IconButton>
          </RequirePermission>
        ),
      }}
    >
      {openEditModal && (
        <MembersEditModal
          columns={columns}
          tableData={tableData}
          setEditModal={setOpenEditModal}
          leadEntity={leadEntity}
        />
      )}
      {!loading ? (
        <Table
          columns={columns}
          data={[
            ...(leadEntity
              ? [
                  {
                    user: leadEntity,
                    role: 'Workstream Lead',
                  },
                ]
              : []),
            ...tableData,
          ]}
          options={{
            padding: 'dense',
            toolbar: false,
            draggable: false,
            pageSize: 10,
            pageSizeOptions: [10, 20, 30],
          }}
        />
      ) : (
        <Progress />
      )}
    </InfoCard>
  );
};
