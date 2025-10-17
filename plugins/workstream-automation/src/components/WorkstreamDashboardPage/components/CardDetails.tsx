import { parseEntityRef } from '@backstage/catalog-model';
import { Table, TableColumn } from '@backstage/core-components';
import { useRouteRef } from '@backstage/core-plugin-api';
import {
  EntityDisplayName,
  EntityRefLink,
  entityRouteRef,
} from '@backstage/plugin-catalog-react';
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
import { Link } from 'react-router-dom';

const useStyles = makeStyles(theme => ({
  root: {},
  closeButton: {
    position: 'fixed',
    right: theme.spacing(3),
    zIndex: theme.zIndex.drawer + 2,
  },
}));

function isEntityRef(value: string): boolean {
  return /^[a-zA-Z0-9]+:[a-zA-Z0-9-_/]+$/.test(value);
}

export const CardDetails = (props: {
  title: string;
  entities: (WorkstreamEntity | ArtEntity)[];
  filteredEntities: (WorkstreamEntity | ArtEntity)[];
  toggleDrawer: Function;
  jsonPath: string;
}) => {
  const { entities, filteredEntities, title, toggleDrawer, jsonPath } = props;
  const classes = useStyles();
  const entityRoute = useRouteRef(entityRouteRef);

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
            {result.map(value =>
              isEntityRef(value) ? (
                <Chip
                  key={value}
                  size="small"
                  style={{ marginBlock: 4 }}
                  clickable
                  component={Link}
                  to={entityRoute(parseEntityRef(value))}
                  label={
                    <EntityDisplayName
                      entityRef={parseEntityRef(value)}
                      hideIcon
                    />
                  }
                />
              ) : (
                <Chip
                  key={value}
                  label={value}
                  size="small"
                  style={{ marginBlock: 4 }}
                />
              ),
            )}
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
        <Typography variant="h2">More Details</Typography>
      </Box>
      <Box>
        <Typography
          variant="body1"
          style={{ fontSize: '18px', marginBlock: '8px' }}
        >
          {entities.length > 0 ? `${entities[0].kind}s` : 'Workstreams'} that{' '}
          <b>don't</b> have <b>{title}</b> ({rev.length})
        </Typography>
        <Table
          data={rev}
          columns={columns}
          style={{ outline: '0px' }}
          options={{
            toolbar: false,
            paging: false,
            draggable: false,
            padding: 'dense',
          }}
        />
      </Box>
      <Box>
        <Typography
          variant="body1"
          style={{ fontSize: '18px', marginTop: '32px', marginBottom: '8px' }}
        >
          {entities.length > 0 ? `${entities[0].kind}s` : 'Workstreams'} that{' '}
          <b>has {title}</b> ({filteredEntities.length})
        </Typography>
        <Table
          data={filteredEntities}
          columns={columns}
          style={{ outline: '0px' }}
          options={{
            toolbar: false,
            paging: false,
            draggable: false,
            padding: 'dense',
          }}
        />
      </Box>
    </Box>
  );
};
