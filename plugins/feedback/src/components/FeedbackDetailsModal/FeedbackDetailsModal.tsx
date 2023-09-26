import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Snackbar,
  Theme,
  Typography,
  createStyles,
  makeStyles,
} from '@material-ui/core';
import { parseEntityRef } from '@backstage/catalog-model';
import { EntityRefLink } from '@backstage/plugin-catalog-react';
import React, { useEffect, useState } from 'react';
import { FeedbackModel } from '../../models/feedback.model';
import { feedbackApiRef } from '../../api';
import { useApi } from '@backstage/core-plugin-api';
import { useQueryParamState } from '@backstage/core-components';
import SmsOutlined from '@material-ui/icons/SmsOutlined';
import BugReportOutlined from '@material-ui/icons/BugReportOutlined';
import CloseRounded from '@material-ui/icons/CloseRounded';
import ArrowForwardRounded from '@material-ui/icons/ArrowForwardRounded';
import { Alert } from '@material-ui/lab';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    closeButton: {
      position: 'absolute',
      right: theme.spacing(1),
      top: theme.spacing(1),
      color: theme.palette.grey[500],
    },
    dialogAction: {
      justifyContent: 'flex-start',
      paddingLeft: theme.spacing(3),
      paddingBottom: theme.spacing(2),
    },
    dialogTitle: {
      '& > *': {
        display: 'flex',
        alignItems: 'center',
      },
      paddingBottom: theme.spacing(0),
    },
    submittedBy: {
      color: theme.palette.textSubtle,
      fontWeight: 500,
    },
  }),
);

export const FeedbackDetailsModal = () => {
  const classes = useStyles();
  const api = useApi(feedbackApiRef);
  const [queryState, setQueryState] = useQueryParamState<string | undefined>(
    'id',
  );
  const [modalData, setModalData] = useState<FeedbackModel>();
  const [snackbarOpen, setSnackbarOpen] = useState({
    message: '',
    open: false,
  });

  useEffect(() => {
    if (queryState) {
      api.getFeedbackById(queryState!).then(resp => {
        if (resp?.error !== undefined) {
          setSnackbarOpen({ message: resp.error, open: true });
        } else {
          const respData: FeedbackModel = resp?.data!;
          setModalData(respData);
        }
      });
    }
  }, [queryState]);

  const handleSnackbarClose = (
    event?: React.SyntheticEvent,
    reason?: string,
  ) => {
    event?.preventDefault();
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen({ ...snackbarOpen, open: false });
    setQueryState(undefined);
  };

  const handleClose = () => {
    setQueryState(undefined);
  };

  return (
    <Dialog
      open={Boolean(queryState)}
      onClose={handleClose}
      aria-labelledby="dialog-title"
      fullWidth
      maxWidth="sm"
      scroll="paper"
    >
      {!modalData ? (
        <>
          <Snackbar
            open={snackbarOpen.open}
            autoHideDuration={6000}
            onClose={handleSnackbarClose}
          >
            <Alert severity="error" onClose={handleSnackbarClose}>
              {snackbarOpen.message}
            </Alert>
          </Snackbar>
        </>
      ) : (
        <>
          <DialogTitle className={classes.dialogTitle} id="dialog-title">
            {modalData.feedbackType === 'FEEDBACK' ? (
              <SmsOutlined />
            ) : (
              <BugReportOutlined />
            )}
            &nbsp;{modalData.summary}
            <IconButton
              aria-label="close"
              className={classes.closeButton}
              onClick={handleClose}
            >
              <CloseRounded />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Grid
              container
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              spacing={2}
            >
              <Grid item xs={12}>
                <Typography className={classes.submittedBy} variant="body2">
                  Submitted by&nbsp;
                  <EntityRefLink entityRef={modalData.createdBy}>
                    {parseEntityRef(modalData.createdBy).name}
                  </EntityRefLink>{' '}
                  on {new Date(modalData.createdAt).toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body1">
                  {modalData.description
                    ? modalData.description
                    : 'No description provided'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <List disablePadding>
                  <ListItem>
                    <ListItemText
                      primary={
                        modalData.feedbackType === 'FEEDBACK'
                          ? 'Feedback submitted for'
                          : 'Issue raised for'
                      }
                    />
                    <ListItemSecondaryAction>
                      <ListItemText
                        primary={
                          <EntityRefLink
                            entityRef={parseEntityRef(modalData.projectId)}
                          >
                            <Chip
                              clickable
                              variant="outlined"
                              color="primary"
                              label={
                                modalData.projectId.split('/').slice(-1)[0]
                              }
                            />
                          </EntityRefLink>
                        }
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Type" />
                    <ListItemSecondaryAction>
                      <ListItemText
                        primary={
                          <>
                            <Chip
                              variant="outlined"
                              label={modalData.feedbackType}
                            />
                            <Chip variant="outlined" label={modalData.tag} />
                          </>
                        }
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  {modalData.ticketUrl && (
                    <ListItem>
                      <ListItemText primary="Ticket Id" />
                      <ListItemSecondaryAction>
                        <ListItemText
                          primary={
                            modalData.ticketUrl.split('/').pop() || 'N/A'
                          }
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  )}
                </List>
              </Grid>
            </Grid>
          </DialogContent>
          {modalData.ticketUrl && (
            <DialogActions className={classes.dialogAction}>
              <Button
                target="_blank"
                endIcon={<ArrowForwardRounded />}
                rel="noopener noreferrer"
                href={modalData.ticketUrl}
                color="primary"
              >
                View Ticket
              </Button>
            </DialogActions>
          )}
        </>
      )}
    </Dialog>
  );
};
