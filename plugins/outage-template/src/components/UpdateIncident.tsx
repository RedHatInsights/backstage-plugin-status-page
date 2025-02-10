import { useAnalytics } from '@backstage/core-plugin-api';
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
  TextField,
} from '@material-ui/core';
import React, { useEffect, useState } from 'react';

const UpdateIncident: React.FC<UpdateIncidentProps> = ({
  component,
  open,
  incidentId,
  incidentData,
  onClose,
  onUpdate,
}) => {
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');
  const [impactOverride, setImpactOverride] = useState('');
  const [body, setBody] = useState('');
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const [components, setComponents] = useState<any | []>([]);
  const [scheduledFor, setScheduledFor] = useState(new Date().toISOString());
  const [scheduledUntil, setScheduledUntil] = useState(
    new Date().toISOString(),
  );
  const [scheduledAutoCompleted, setScheduledAutoCompleted] = useState(true);

  useEffect(() => {
    if (incidentData) {
      setName(incidentData.name || '');
      setStatus(incidentData.status || '');
      setImpactOverride(incidentData.impactOverride || '');
      setBody(incidentData.body || '');
      setScheduledFor(incidentData.scheduledFor || '');
      setScheduledUntil(incidentData.scheduledUntil || '');
      setScheduledAutoCompleted(incidentData.scheduledAutoCompleted || '');
      setComponents(component);
      setSelectedComponents(
        incidentData.components?.map((value: { id: string }) => value.id) || [],
      );
    }
  }, [incidentData, component]);

  const handleComponentChange = (
    event: React.ChangeEvent<{ value: unknown }>,
  ) => {
    setSelectedComponents(event.target.value as string[]);
  };

  const analytics = useAnalytics();

  const handleUpdate = () => {
    onUpdate(incidentId, {
      status,
      impact_override: impactOverride,
      body,
      component_ids: selectedComponents,
      scheduled_until: scheduledUntil,
      scheduled_auto_completed: scheduledAutoCompleted || false,
    });

    if (scheduledUntil) {
      analytics.captureEvent('update', `Maintenance Updated }`);
    } else {
      analytics.captureEvent('update', `Incident Updated`);
    }

    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>
        {scheduledFor ? 'Update Maintenance' : 'Update Incident'}
      </DialogTitle>
      <DialogContent>
        <TextField
          label={scheduledFor ? 'Maintenance Name' : 'Incident Name'}
          fullWidth
          value={name}
          disabled
          style={{ marginBottom: 20 }}
        />

        <FormControl fullWidth style={{ marginBottom: 20 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={status}
            onChange={e => setStatus(e.target.value as string)}
            label="Status"
          >
            {scheduledFor
              ? [
                  <MenuItem key="scheduled" value="scheduled">
                    Scheduled
                  </MenuItem>,
                  <MenuItem key="in_progress" value="in_progress">
                    In Progress
                  </MenuItem>,
                  <MenuItem key="verifying" value="verifying">
                    Verifying
                  </MenuItem>,
                  <MenuItem key="completed" value="completed">
                    Completed
                  </MenuItem>,
                ]
              : [
                  <MenuItem key="identified" value="identified">
                    Identified
                  </MenuItem>,
                  <MenuItem key="investigating" value="investigating">
                    Investigating
                  </MenuItem>,
                  <MenuItem key="monitoring" value="monitoring">
                    Monitoring
                  </MenuItem>,
                  <MenuItem key="resolved" value="resolved">
                    Resolved
                  </MenuItem>,
                ]}
          </Select>
        </FormControl>

        <FormControl fullWidth style={{ marginBottom: 20 }}>
          <InputLabel>Impact</InputLabel>
          <Select
            value={impactOverride}
            onChange={e => setImpactOverride(e.target.value as string)}
          >
            <MenuItem value="none">None</MenuItem>
            <MenuItem value="minor">Minor</MenuItem>
            <MenuItem value="major">Major</MenuItem>
            <MenuItem value="critical">Critical</MenuItem>
          </Select>
        </FormControl>

        {scheduledFor && (
          <>
            <TextField
              label="Start Time"
              fullWidth
              type="datetime-local"
              value={
                scheduledFor
                  ? new Date(scheduledFor).toISOString().slice(0, 16)
                  : ''
              }
              disabled
              InputLabelProps={{ shrink: true }}
              style={{ marginBottom: 20 }}
            />
            <TextField
              label="End Time"
              fullWidth
              type="datetime-local"
              value={
                scheduledUntil
                  ? new Date(scheduledUntil).toISOString().slice(0, 16)
                  : ''
              }
              onChange={e => setScheduledUntil(e.target.value)}
              InputLabelProps={{ shrink: true }}
              style={{ marginBottom: 20 }}
            />
          </>
        )}

        {scheduledFor && (
          <FormControlLabel
            control={
              <Checkbox
                checked={scheduledAutoCompleted}
                onChange={e => setScheduledAutoCompleted(e.target.checked)}
              />
            }
            label="Auto complete the maintenance"
            style={{ marginBottom: 20, maxWidth: '100%' }}
          />
        )}

        <FormControl fullWidth style={{ marginBottom: 20 }}>
          <InputLabel>Select Components</InputLabel>
          <Select
            multiple
            value={selectedComponents}
            onChange={handleComponentChange}
            renderValue={(selected: any) =>
              selected
                .map((id: number) => {
                  const data = components.find((c: any) => c.id === id);
                  return data ? data.name : null;
                })
                .join(', ')
            }
          >
            {components.map((value: any) => (
              <MenuItem key={value.id} value={value.id}>
                <Checkbox checked={selectedComponents.includes(value.id)} />
                <ListItemText primary={value.name} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Description"
          fullWidth
          value={body}
          onChange={e => setBody(e.target.value)}
          multiline
          rows={4}
          style={{ marginBottom: 20 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleUpdate} color="primary">
          Update
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UpdateIncident;
