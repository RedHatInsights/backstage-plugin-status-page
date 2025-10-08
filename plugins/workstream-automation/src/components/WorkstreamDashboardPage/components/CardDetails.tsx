import { TableColumn, Table } from '@backstage/core-components';
import { EntityRefLink } from '@backstage/plugin-catalog-react';
import {
  ArtEntity,
  WorkstreamEntity,
} from '@compass/backstage-plugin-workstream-automation-common';
import {
  Box,
  Chip,
  IconButton,
  makeStyles,
  Typography,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/CloseOutlined';
import { JSONPath as jsonPathFn } from 'jsonpath-plus';
import { useMemo } from 'react';

const useStyles = makeStyles(theme => ({
  root: {},
  closeButton: {
    position: 'fixed',
    right: theme.spacing(3),
    zIndex: theme.zIndex.drawer + 2,
  },
}));

export const CardDetails = (props: {
  title: string;
  entities: (WorkstreamEntity | ArtEntity)[];
  filteredEntities: (WorkstreamEntity | ArtEntity)[];
  toggleDrawer: Function;
  jsonPath: string;
}) => {
  const { entities, filteredEntities, title, toggleDrawer, jsonPath } = props;
  const classes = useStyles();

  const rev = useMemo(
    () =>
      entities.filter(
        e => !filteredEntities.some(f => f.metadata.name === e.metadata.name),
      ),
    [entities, filteredEntities],
  );

  const columns: TableColumn<WorkstreamEntity | ArtEntity>[] = [
    {
      field: 'metadata.name',
      title: entities.length > 0 ? `${entities[0].kind} Name` : 'Name', // dynamically get title 'Workstream' / 'ART'
      render: data => <EntityRefLink entityRef={data} />,
    },
    {
      title: 'Resolved Value',
      render: data => {
        const result = jsonPathFn<string[]>({ path: jsonPath, json: data });
        if (!Array.isArray(result) || result.length === 0) return '-';

        return (
          <Box display="flex" flexWrap="wrap">
            {result.map(r => (
              <Chip label={r} key={r} />
            ))}
          </Box>
        );
      },
    },
  ];

  return (
    <Box minWidth="700px" margin={3} display="flex" flexDirection="column">
      <Box className={classes.closeButton}>
        <IconButton color="default" onClick={() => toggleDrawer()}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Box>
        <Typography
          variant="body1"
          style={{ fontSize: '18px', marginBlock: '8px' }}
        >
          Workstreams that <b>don't</b> have <b>{title}</b> ({rev.length})
        </Typography>
        <Table
          data={rev}
          columns={columns}
          style={{ outline: '0px' }}
          options={{
            toolbar: false,
            paging: false,
            draggable: false,
          }}
        />
      </Box>
      <Box>
        <Typography
          variant="body1"
          style={{ fontSize: '18px', marginTop: '32px', marginBottom: '8px' }}
        >
          Workstreams that <b>has {title}</b> ({filteredEntities.length})
        </Typography>
        <Table
          data={filteredEntities}
          columns={columns}
          style={{ outline: '0px' }}
          options={{
            toolbar: false,
            paging: false,
            draggable: false,
          }}
        />
      </Box>
    </Box>
  );
};
