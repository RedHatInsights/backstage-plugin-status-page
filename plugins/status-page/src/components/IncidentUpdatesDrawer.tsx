import {
  Box,
  Chip,
  Drawer,
  Paper,
  Step,
  Stepper,
  Typography,
} from '@material-ui/core';
import React from 'react';

const IncidentUpdatesDrawer = ({
  open,
  onClose,
  data,
}: IncidentUpdatesDrawerProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'primary';
      case 'investigating':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box style={{ width: 400, padding: 20 }}>
        {data.component && data.component.length > 0 && (
          <Box style={{ marginBottom: 20 }}>
            <Typography variant="h6" style={{ marginTop: 0, marginBottom: 8 }}>
              Components Affected
            </Typography>
            <Paper elevation={2} style={{ padding: 12, marginBottom: 10 }}>
              {data.component.map((component: any) => (
                <Typography variant="body2">- {component.name}</Typography>
              ))}
            </Paper>
          </Box>
        )}
        <Typography variant="h6" style={{ marginTop: 0, marginBottom: 8 }}>
          Incident Updates
        </Typography>
        <Stepper orientation="vertical" style={{ padding: 0 }}>
          {data.updates.map((update: any, index: number) => (
            <Paper elevation={2} style={{ padding: 12, marginBottom: 10 }}>
              <Step key={index} active>
                <Chip
                  label={update.status}
                  color={getStatusColor(update.status)}
                  size="small"
                  style={{ margin: '2px' }}
                />
                <Typography variant="body2" color="textSecondary">
                  {new Date(update.createdAt).toLocaleString()}
                </Typography>
                <Typography variant="body2" style={{ textAlign: 'justify' }}>
                  {update.body}
                </Typography>
              </Step>
            </Paper>
          ))}
        </Stepper>
      </Box>
    </Drawer>
  );
};

export default IncidentUpdatesDrawer;
