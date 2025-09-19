import { Link } from '@backstage/core-components';
import { Table, TableColumn } from '@backstage/core-components';
import { Platform } from '../../types';

interface PlatformListViewProps {
  platforms: Platform[];
}

export const PlatformListView = ({ platforms }: PlatformListViewProps) => {
  const columns: TableColumn[] = [
    {
      title: 'Name',
      field: 'name',
      render: (rowData: any) => (
        <Link to={`/compliance/ess/platform/${encodeURIComponent(rowData.name)}`}>
          {rowData.title || rowData.name}
        </Link>
      ),
    },
    {
      title: 'Owner',
      field: 'owner',
    },
    {
      title: 'Description',
      field: 'description',
    },
    {
      title: 'Kind',
      field: 'kind',
    },
    {
      title: 'Namespace',
      field: 'namespace',
    },
  ];

  const data = platforms.map(platform => ({
    name: platform.name,
    title: platform.metadata.title,
    owner: platform.owner || 'N/A',
    description: platform.description || 'No description available',
    kind: platform.kind,
    namespace: platform.namespace,
  }));

  return (
    <Table
      title="Platforms"
      options={{
        search: true,
        paging: true,
        pageSize: 10,
        pageSizeOptions: [5, 10, 20],
      }}
      columns={columns}
      data={data}
    />
  );
};
