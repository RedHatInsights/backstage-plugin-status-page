import React from 'react';
import { Drawer, Box, Typography, Paper } from '@material-ui/core';

const IncidentUpdatesDrawer = ({
  open,
  onClose,
  updates,
}: IncidentUpdatesDrawerProps) => {
  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box style={{ width: 400, padding: 20 }}>
        <Typography variant="h6">Incident Updates</Typography>
        {updates.map((update, index) => (
          <Paper key={index} style={{ padding: 10, marginBottom: 10 }}>
            <Typography variant="subtitle1">
              <strong>Status:</strong> {update.status}
            </Typography>
            <Typography variant="body2">{update.body}</Typography>
          </Paper>
        ))}
      </Box>
    </Drawer>
  );
};

export default IncidentUpdatesDrawer;
