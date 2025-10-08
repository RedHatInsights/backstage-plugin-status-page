import { parseEntityRef } from '@backstage/catalog-model';
import { Progress, Table, TableColumn } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import { EntityRefLink } from '@backstage/plugin-catalog-react';
import { Chip, Divider, Paper, Typography } from '@material-ui/core';
import { DateTime } from 'luxon';
import useAsync from 'react-use/esm/useAsync';
import { noteApiRef } from '../../../api';
import { Contributor } from './types';
import { UserNote } from '@compass/backstage-plugin-workstream-automation-common';

export type ContributorProps = {
  contributor: Contributor;
};

const UserNoteComponent = (props: { userRef: string }) => {
  const { userRef } = props;

  const noteApi = useApi(noteApiRef);

  const { value: note, loading } = useAsync(async () => {
    const resp = await noteApi.getNote(userRef);
    if (resp) return resp as UserNote;
    return undefined;
  }, []);

  if (loading) return <Progress />;
  if (!note) return null;
  if (!note.note) return null;

  let noteEditor;
  try {
    noteEditor = (
      <EntityRefLink
        entityRef={parseEntityRef(note.editHistory.at(-1)!.userRef)}
      >
        {parseEntityRef(note.editHistory.at(-1)!.userRef).name}
      </EntityRefLink>
    );
  } catch (error) {
    noteEditor = note.editHistory.at(-1)!.userRef;
  }

  return (
    <Paper style={{ marginBottom: '3px' }}>
      <Typography
        style={{
          padding: '10px',
          whiteSpace: 'pre-wrap',
          overflowWrap: 'anywhere',
        }}
      >
        {note.note}
      </Typography>
      <Divider />
      <Typography
        style={{ padding: '5px 10px' }}
        component="p"
        variant="caption"
      >
        Added by {noteEditor}
        ,&nbsp;
        {DateTime.fromISO(
          note.editHistory.at(-1)?.timestamp ?? '',
        ).toRelative()}
      </Typography>
    </Paper>
  );
};

export const ContributorDetails = ({ contributor }: ContributorProps) => {
  const columns: TableColumn<{ workstreamRef: string; role?: string }>[] = [
    {
      id: 'title',
      field: 'workstreamRef',
      defaultSort: 'asc',
      title: 'Workstream Name',
      render: data => <EntityRefLink entityRef={data.workstreamRef} />,
    },
    {
      id: 'role',
      field: 'role',
      title: 'Role',
      render: data => data.role && <Chip label={data.role} size="small" />,
    },
  ];

  return (
    <Table
      columns={columns}
      style={{ outline: '0px', height: '100%' }}
      components={{
        Toolbar: () => <UserNoteComponent userRef={contributor.userRef} />,
      }}
      options={{
        padding: 'dense',
        search: false,
        paging: false,
        minBodyHeight: '0px',
        maxBodyHeight: 270,

        draggable: false,

        headerStyle: {
          position: 'sticky',
          top: 0,
        },
      }}
      data={contributor.commonWs}
    />
  );
};
