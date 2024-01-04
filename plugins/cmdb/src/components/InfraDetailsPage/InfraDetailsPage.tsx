import { useEntity } from '@backstage/plugin-catalog-react';
import React from 'react';
import { getAppCodeFromEntity } from '../../utils/getAppCodeFromEntity';
import { useInfraDetails } from '../../hooks/useInfraDetails';
import { Progress, Table, TableColumn } from '@backstage/core-components';
import { Paper, TableContainer } from '@material-ui/core';
import { InfraDetails } from '../../apis';

export const InfraDetailsComponent = () => {
  const { entity } = useEntity();
  const appCode = getAppCodeFromEntity(entity);
  const { loading, infraDetails } = useInfraDetails(appCode);

  if (loading) return <Progress />;

  const columns: TableColumn<InfraDetails>[] = [
    {
      title: 'Cluster',
      field: 'child.name',
      defaultGroupOrder: 0,
    },
    {
      title: 'Name',
      field: 'parent.name',
    },
    {
      title: 'Class',
      field: 'parent.sys_class_name',
    },
    {
      title: 'Updated on',
      field: 'sys_updated_on',
    },
  ];

  return (
    <TableContainer component={Paper}>
      <Table
        options={{
          searchFieldVariant: 'outlined',
          pageSize: 10,
          emptyRowsWhenPaging: false,
          grouping: false,
          draggable: false,
        }}
        title="Infrastructure Details"
        data={infraDetails}
        columns={columns}
      />
    </TableContainer>
  );
};
