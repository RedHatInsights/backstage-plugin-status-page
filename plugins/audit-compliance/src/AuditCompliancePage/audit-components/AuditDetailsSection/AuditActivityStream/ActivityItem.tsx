
import { Box, Grid, Typography } from '@material-ui/core';
import { format } from 'date-fns';
import { useStyles } from './AuditActivityStream.styles';
import { AuditEvent } from './types';
import { getEventType, getActivityIcon } from './utils';
import { ACTIVITY_MESSAGES } from './ActivityMessage';

interface ActivityItemProps {
  event: AuditEvent;
}

export const ActivityItem: React.FC<ActivityItemProps> = ({ event }) => {
  const classes = useStyles();
  const eventType = getEventType(event);
  const dateString =
    event.created_at || event.performed_at || new Date().toISOString();
  const dateObj = new Date(dateString);

  return (
    <Grid container spacing={2} style={{ marginBottom: '8px' }}>
      <Grid item xs={2}>
        <div>
          <Typography className={classes.timestamp}>
            {format(dateObj, 'hh:mm a')}
          </Typography>
          <Typography className={classes.date}>
            {format(dateObj, 'MMM dd yyyy')}
          </Typography>
        </div>
      </Grid>
      <Grid item xs={1} style={{ marginTop: '4px' }}>
        {getActivityIcon(eventType)}
      </Grid>
      <Grid item xs={8}>
        <Box mb={1}>
          {ACTIVITY_MESSAGES[eventType as keyof typeof ACTIVITY_MESSAGES]?.(
            event,
          ) || ACTIVITY_MESSAGES.default(event)}
        </Box>
      </Grid>
    </Grid>
  );
};
