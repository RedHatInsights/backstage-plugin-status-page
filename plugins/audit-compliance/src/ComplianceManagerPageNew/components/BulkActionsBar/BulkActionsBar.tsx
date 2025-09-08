import React from 'react';
import { Box, Button, Paper, Typography } from '@material-ui/core';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import EmailIcon from '@material-ui/icons/Email';
import { useStyles } from './styles';
import { BulkActionsBarProps } from './types';

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  onInitiateAudit,
  onSendEmail,
}) => {
  const classes = useStyles();

  return (
    <Paper className={classes.container}>
      <Typography className={classes.title}>Bulk Actions</Typography>
      <Typography
        variant="body2"
        color="textSecondary"
        className={classes.subtitle}
      >
        Select applications and perform bulk operations
      </Typography>

      <Box className={classes.buttonContainer}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PlayArrowIcon />}
          onClick={onInitiateAudit}
          className={classes.primaryButton}
          size="large"
        >
          Initiate Audit
        </Button>

        <Button
          variant="contained"
          startIcon={<EmailIcon />}
          onClick={onSendEmail}
          className={classes.secondaryButton}
          size="large"
        >
          Send Email
        </Button>
      </Box>
    </Paper>
  );
};
