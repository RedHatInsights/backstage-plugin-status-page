import { InfoCard, useQueryParamState } from '@backstage/core-components';
import {
  Box,
  Button,
  createStyles,
  Drawer,
  Grid,
  LinearProgress,
  makeStyles,
  Theme,
  Typography,
  withStyles,
} from '@material-ui/core';
import {
  ArtEntity,
  WorkstreamEntity,
} from '@compass/backstage-plugin-workstream-automation-common';
import { useMemo, useState } from 'react';
import { CardDetails } from './CardDetails';
import { JSONPath as jsonPathFn } from 'jsonpath-plus';
import { Skeleton } from '@material-ui/lab';

const useStyles = makeStyles(theme => ({
  root: {
    '&:hover': {
      boxShadow: theme.shadows[5],
    },
  },

  headerAction: {
    margin: theme.spacing(0.5),
    alignSelf: 'center',
  },
  card: {
    paddingTop: '0px',
    backgroundColor: '#0000',
  },
}));

type CardProps = {
  title: string;
  color: string;
  workstreams: (WorkstreamEntity | ArtEntity)[];
  jsonPath: string;
  loading: boolean;
};

const CustomLinearProgress = withStyles((theme: Theme) =>
  createStyles({
    colorPrimary: {
      backgroundColor: theme.palette.border,
    },
    bar: {
      backgroundColor: (props: { barColor: string }) => props.barColor,
    },
  }),
)(LinearProgress);

const SkeletonCard = () => (
  <Grid item xs={12} sm={6} lg={4} xl={3}>
    <Skeleton style={{ transform: 'scale(1, 0.80)' }} height={70} />
    <Skeleton style={{ transform: 'scale(1, 0.60)' }} height={40} width="40%" />
    <Skeleton style={{ transform: 'scale(1, 0.60)' }} height={20} />
  </Grid>
);

export const GridCard = ({
  title = '',
  color,
  workstreams,
  jsonPath,
  loading = true,
}: CardProps) => {
  const classes = useStyles();

  const filtered = useMemo(
    () =>
      workstreams.filter(ws => {
        const result = jsonPathFn<any[]>({ path: jsonPath, json: ws });
        return result.length > 0 ? ws : undefined;
      }),
    [jsonPath, workstreams],
  );

  const [query, setQuery] = useQueryParamState<string | undefined>('path');

  const percent = (filtered.length / workstreams.length) * 100;
  const [isOpen, toggleDrawer] = useState(query === jsonPath);

  function onClose() {
    setQuery(undefined);
    toggleDrawer(false);
  }

  return loading ? (
    <SkeletonCard />
  ) : (
    <Grid item xs={12} sm={6} lg={4} xl={3}>
      <InfoCard
        title={title}
        divider={false}
        variant="gridItem"
        headerProps={{
          action: (
            <Button
              variant="outlined"
              color="default"
              children="See Details"
              onClick={() => {
                setQuery(jsonPath);
                toggleDrawer(true);
              }}
            />
          ),
          classes: {
            action: classes.headerAction,
          },
        }}
        cardClassName={classes.card}
        className={classes.root}
      >
        <Box display="flex" alignItems="center">
          <Typography variant="h2" style={{ fontWeight: 'bold' }}>
            {filtered.length}&nbsp;
          </Typography>
          <Typography color="textSecondary">/ {workstreams.length}</Typography>
        </Box>
        <Box display="flex" alignItems="center">
          <Box width="100%" mr={1}>
            <CustomLinearProgress
              variant="determinate"
              value={percent}
              barColor={color}
            />
          </Box>
          <Box minWidth={35}>
            <Typography variant="body2" color="textSecondary">{`${Math.round(
              percent ?? 0,
            )}%`}</Typography>
          </Box>
        </Box>
      </InfoCard>
      <Drawer anchor="right" open={isOpen} onClose={onClose}>
        <CardDetails
          title={title}
          entities={workstreams}
          filteredEntities={filtered}
          toggleDrawer={onClose}
          jsonPath={jsonPath}
        />
      </Drawer>
    </Grid>
  );
};
