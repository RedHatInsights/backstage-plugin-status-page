import React from 'react';
import { Drawer, Box, Typography, Paper } from '@material-ui/core';

const IncidentUpdatesDrawer = ({
  open,
  onClose,
  data,
}: IncidentUpdatesDrawerProps) => {
  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box style={{ width: 400, padding: 20 }}>
        <Box style={{ marginBottom: 20 }}>
          <Typography variant="subtitle1">
            <strong>Components Affected:</strong>
          </Typography>
          {data.component.map((component: any, index: number) => (
            <Typography key={index} variant="body2">
              - {component.name}
            </Typography>
          ))}
        </Box>
        <Typography variant="h6">Incident Updates</Typography>
        {data.updates.map((update: any, index: number) => (
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
