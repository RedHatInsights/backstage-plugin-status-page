import React, { useEffect, useState } from 'react';
import {
  Avatar,
  Box,
  Grid,
  Theme,
  Typography,
  createStyles,
  makeStyles,
  IconButton,
  Menu,
  MenuItem,
  Checkbox,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
} from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';
import { InfoCard, Progress } from '@backstage/core-components';
import { useEntity } from '@backstage/plugin-catalog-react';
import { useProjectInfo, useProjectEntity } from '../../hooks';
import { EntityProps, ProjectDetailsProps } from '../../types';
import { Status } from './components/Status';
import { ActivityStream } from './components/ActivityStream';
import { Selectors } from './components/Selectors';
import { useEmptyIssueTypeFilter } from '../../hooks/useEmptyIssueTypeFilter';
import MoreVertIcon from '@material-ui/icons/MoreVert';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    infoCard: {
      marginBottom: theme.spacing(3),
      '& + .MuiAlert-root': {
        marginTop: theme.spacing(3),
      },
    },
    root: {
      flexGrow: 1,
      fontSize: '0.75rem',
      '& > * + *': {
        marginTop: theme.spacing(1),
      },
    },
    ticketLink: {
      color: theme.palette.link,
      textDecoration: 'none',
      transition: 'color 0.3s',
      '&:hover': {
        color: theme.palette.linkHover,
      },
    },
  }),
);

const CardProjectDetails = ({
  project,
  component,
}: {
  project: ProjectDetailsProps;
  component: string;
}) => (
  <Box display="inline-flex" alignItems="center">
    <Avatar alt="" src={project.iconUrl} />
    <Box ml={1}>
      {project.name} | {project.type}
      {component ? <Box>component: {component}</Box> : null}
    </Box>
  </Box>
);

type JiraCardOptionalProps = {
  hideIssueFilter?: boolean;
};

export const JiraCard = (props: EntityProps & JiraCardOptionalProps) => {
  const { hideIssueFilter } = props;
  const { entity } = useEntity();
  const classes = useStyles();
  const { projectKey, component, tokenType, label } = useProjectEntity(entity);
  const [statusesNames, setStatusesNames] = useState<Array<string>>([]);
  const {
    project,
    issues,
    tickets,
    projectLoading,
    projectError,
    fetchProjectInfo,
  } = useProjectInfo(projectKey, component, label, statusesNames);
  const {
    issueTypes: displayIssues,
    type,
    changeType,
  } = useEmptyIssueTypeFilter(issues);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    setPage(0);
  }, [tickets]);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <InfoCard
      className={classes.infoCard}
      title="Jira"
      subheader={
        project && (
          <Box
            display="flex"
            justifyContent="space-between"
            width="100%"
            alignItems="center"
          >
            <Box>
              <CardProjectDetails project={project} component={component} />
              <Box display="inline-flex" pl={1}>
                <IconButton
                  aria-label="more"
                  aria-controls="long-menu"
                  aria-haspopup="true"
                  onClick={handleClick}
                >
                  <MoreVertIcon />
                </IconButton>
                <Menu
                  id="simple-menu"
                  anchorEl={anchorEl}
                  keepMounted
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                >
                  <MenuItem onClick={changeType}>
                    <Checkbox checked={type === 'all'} />
                    <>Show empty issue types</>
                  </MenuItem>
                </Menu>
              </Box>
            </Box>
            <Box>
              <Button variant="outlined" size="small" href={`${project?.url}/browse/${projectKey}`} target="_blank">
                Go to Project
              </Button>
            </Box>
          </Box>
        )
      }
    >
      {projectLoading && !(project && issues) ? <Progress /> : null}
      {projectError ? (
        <Alert severity="error" className={classes.infoCard}>
          {projectError.message}
        </Alert>
      ) : null}
      {project && issues ? (
        <div className={classes.root}>
          {!hideIssueFilter && (
            <Selectors
              projectKey={projectKey}
              statusesNames={statusesNames}
              setStatusesNames={setStatusesNames}
              fetchProjectInfo={fetchProjectInfo}
            />
          )}
          <Grid container spacing={3}>
            {displayIssues?.map(issueType => (
              <Grid item xs key={issueType.name}>
                <Box
                  width={100}
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Status name={issueType.name} iconUrl={issueType.iconUrl} />
                  <Typography variant="h4">{issueType.total}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
          <Divider />
          <TableContainer>
            <Table className={classes.infoCard} aria-label="tickets-table">
              <TableHead>
                <TableRow>
                  <TableCell>Key</TableCell>
                  <TableCell align="left">Summary</TableCell>
                  <TableCell align="left">Priority</TableCell>
                  <TableCell align="left">Status</TableCell>
                  <TableCell align="left">Created</TableCell>
                  <TableCell align="left">Updated</TableCell>
                  <TableCell align="left">Assignee</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tickets && tickets.length > 0 ? (
                  tickets
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((ticket: any) => (
                      <TableRow key={ticket?.key}>
                        <TableCell component="th">
                          <a
                            href={`${project?.url}/browse/${ticket?.key}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={classes.ticketLink}
                          >
                            {ticket?.key}
                          </a>
                        </TableCell>
                        <TableCell align="left">{ticket?.summary}</TableCell>
                        <TableCell align="left">
                          <img
                            src={ticket?.priority?.iconUrl}
                            alt={ticket?.priority?.name}
                            title={ticket?.priority?.name}
                            width="20px"
                          />
                        </TableCell>
                        <TableCell align="left">{ticket?.status}</TableCell>
                        <TableCell align="left">
                          {new Date(ticket?.created).toLocaleDateString()}
                        </TableCell>
                        <TableCell align="left">
                          {new Date(ticket?.updated).toLocaleDateString()}
                        </TableCell>
                        <TableCell
                          align="left"
                          style={{ display: 'flex', alignItems: 'center' }}
                        >
                          <img
                            src={ticket?.assignee?.avatarUrl}
                            alt={ticket?.assignee?.displayName}
                            title={ticket?.assignee?.displayName}
                            style={{ marginRight: '10px' }}
                            width="30px"
                          />
                          {ticket?.assignee?.displayName}
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No Jira tickets available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 20]}
              component="div"
              count={tickets?.length || 0}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_event, newPage) => setPage(newPage)}
              onRowsPerPageChange={event => {
                setRowsPerPage(parseInt(event.target.value, 10));
                setPage(0);
              }}
            />
          </TableContainer>
          <ActivityStream
            projectKey={projectKey}
            tokenType={tokenType}
            componentName={component}
            label={label}
            tickets={tickets as any}
          />
        </div>
      ) : null}
    </InfoCard>
  );
};
