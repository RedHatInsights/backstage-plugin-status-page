import { WorkstreamDataV1alpha1 } from '@appdev-platform/backstage-plugin-workstream-automation-common';
import {
  InfoCard,
  InfoCardVariants,
  Table,
  TableColumn,
} from '@backstage/core-components';
import {
  catalogApiRef,
  EntityDisplayName,
  EntityRefLink,
  useEntity,
} from '@backstage/plugin-catalog-react';
import React, { useEffect, useState } from 'react';
import { CustomUserEntity } from '../../types';
import { parseEntityRef, stringifyEntityRef } from '@backstage/catalog-model';
import { MembersColumn } from '../WorkstreamTable/MembersColumn';
import { useApi } from '@backstage/core-plugin-api';

export const UserWorkstreamCard = (props: { variant: InfoCardVariants }) => {
  const { entity } = useEntity<CustomUserEntity>();
  const catalogApi = useApi(catalogApiRef);
  const [workstreams, setWorkstreams] = useState<WorkstreamDataV1alpha1[]>([]);
  const [loading, setLoading] = useState(true);
  const inWorkstreams = entity.relations?.filter(
    m => parseEntityRef(m.targetRef).kind === 'workstream',
  );

  useEffect(() => {
    if (loading) {
      const workstreamRefs = inWorkstreams?.map(w => w.targetRef);
      if (workstreamRefs) {
        catalogApi
          .getEntitiesByRefs({ entityRefs: workstreamRefs })
          .then(resp => {
            setWorkstreams(t =>
              t.concat(resp.items as WorkstreamDataV1alpha1[]),
            );
          });
        setLoading(false);
      }
    }
  }, [inWorkstreams, catalogApi, loading]);

  const columns: TableColumn<WorkstreamDataV1alpha1>[] = [
    {
      title: 'Workstream',
      render: data => <EntityRefLink entityRef={data} />,
    },
    {
      title: 'Role',
      tooltip: "Current user's role",
      render: data => {
        if (data.spec.lead === stringifyEntityRef(entity))
          return 'Workstream Lead';
        const member = data.spec.members.find(
          v => v.userRef === stringifyEntityRef(entity),
        );
        return member?.role ?? '-';
      },
    },
    {
      title: 'Lead',
      tooltip: 'Workstream lead',
      render: data => (
        <EntityDisplayName entityRef={parseEntityRef(data.spec.lead)} />
      ),
    },
    {
      title: 'Members',
      render: data => {
        return <MembersColumn members={data.spec.members} />;
      },
    },
  ];

  return (
    <InfoCard {...props} title={`Workstreams (${inWorkstreams?.length})`}>
      <Table
        columns={columns}
        data={workstreams}
        isLoading={loading}
        options={{ toolbar: false, draggable: false, padding: 'dense' }}
      />
    </InfoCard>
  );
};
