import {
  Content,
  InfoCard,
  LinkButton,
  Progress,
} from '@backstage/core-components';
import { Grid, Typography, Divider, makeStyles } from '@material-ui/core';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { GridCard } from './components/Card';
import { ContributorsList } from './components/ContributorsList';
import { useWorkstreams } from './hooks/useWorkstreams';

const useStyles = makeStyles(theme => ({
  root: {
    background: `linear-gradient(60deg, ${theme.palette.infoText}33 0%, ${theme.palette.background.paper} 50%)`,
    '&:hover': {
      boxShadow: theme.shadows[5],
    },
  },
  headerAction: {
    alignSelf: 'center',
    margin: theme.spacing(0.5),
  },
  card: {
    paddingBlock: '0px',
    '&:last-child': {
      paddingBlock: '0px',
    },
    backgroundColor: `${theme.palette.background.paper}00`,
  },
  sectionHeader: {
    fontWeight: 500,
    marginBottom: theme.spacing(2),
  },
}));

export const WorkstreamDashboardContent = () => {
  const classes = useStyles();
  const state = useWorkstreams();

  return (
    <Content>
      <Grid container>
        <Grid item xs={12} sm={6} lg={3}>
          <InfoCard
            title="Workstreams"
            divider={false}
            headerProps={{
              action: (
                <LinkButton
                  variant="outlined"
                  color="primary"
                  children={
                    <>
                      View All&nbsp;
                      <OpenInNewIcon />
                    </>
                  }
                  to="/catalog?filters[kind]=Workstream"
                  target="_blank"
                />
              ),
              classes: {
                action: classes.headerAction,
              },
            }}
            cardClassName={classes.card}
            className={classes.root}
          >
            {state.loading ? (
              <Progress style={{ marginBlock: '16px' }} />
            ) : (
              <Typography
                variant="h2"
                style={{ fontWeight: 'bold', fontSize: '4.2rem' }}
              >
                {state.workstreams.length}
              </Typography>
            )}
          </InfoCard>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <InfoCard
            title="ARTs"
            divider={false}
            headerProps={{
              action: (
                <LinkButton
                  variant="outlined"
                  color="primary"
                  children={
                    <>
                      View All&nbsp;
                      <OpenInNewIcon />
                    </>
                  }
                  to="/catalog?filters[kind]=ART"
                  target="_blank"
                />
              ),
              classes: {
                action: classes.headerAction,
              },
            }}
            cardClassName={classes.card}
            className={classes.root}
          >
            {state.loading ? (
              <Progress style={{ marginBlock: '16px' }} />
            ) : (
              <Typography
                variant="h2"
                style={{ fontWeight: 'bold', fontSize: '4.2rem' }}
              >
                {state.arts.length}
              </Typography>
            )}
          </InfoCard>
        </Grid>
      </Grid>
      <Divider style={{ marginBlock: '16px' }} />
      <Typography variant="h5" className={classes.sectionHeader}>
        In-Depth Scores
      </Typography>
      <Grid container>
        <GridCard
          title="Workstream Lead"
          color="#3B00ED"
          workstreams={state.workstreams}
          jsonPath='$.relations[?(@.type == "leadBy")].targetRef'
          loading={state.loading}
        />
        <GridCard
          title="Technical Lead"
          color="#9C27B0"
          workstreams={state.workstreams}
          jsonPath='$.relations[?(@.type == "technical-lead")].targetRef'
          loading={state.loading}
        />
        <GridCard
          title="Jira Project"
          color="#D81B60"
          workstreams={state.workstreams}
          jsonPath='$.metadata.annotations["jira/project-key"]'
          loading={state.loading}
        />
        <GridCard
          title="Quality Engineer"
          color="#FF9800"
          workstreams={state.workstreams}
          jsonPath='$.relations[?(@.type == "quality-engineer")].targetRef'
          loading={state.loading}
        />
        <GridCard
          title="Consultant"
          color="#5ac11e"
          workstreams={state.workstreams}
          jsonPath='$.relations[?(@.type == "consultant")].targetRef'
          loading={state.loading}
        />
        <GridCard
          title="Software Engineer"
          color="#1e47c1ff"
          workstreams={state.workstreams}
          jsonPath='$.relations[?(@.type == "software-engineer")].targetRef'
          loading={state.loading}
        />
        <GridCard
          title="System Architect"
          color="#ce6910ff"
          workstreams={state.arts}
          jsonPath='$.relations[?(@.type == "system-architect")].targetRef'
          loading={state.loading}
        />
      </Grid>
      <Divider style={{ marginBlock: '16px' }} />
      <Typography variant="h5" className={classes.sectionHeader}>
        Multi-Stream Contributors
      </Typography>
      {state.loading ? (
        <Progress />
      ) : (
        <ContributorsList workstreams={state.workstreams} arts={state.arts} />
      )}
    </Content>
  );
};
