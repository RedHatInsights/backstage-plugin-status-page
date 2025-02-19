import { useAnalytics, alertApiRef, useApi } from '@backstage/core-plugin-api';
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
  Tooltip,
} from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';

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
  const [scheduledFor, setScheduledFor] = useState('');
  const [scheduledUntil, setScheduledUntil] = useState('');
  const [scheduledAutoCompleted, setScheduledAutoCompleted] = useState(true);
  const alertApi = useApi(alertApiRef);

  const handleEndTimeChange = (e: any) => {
    const newEndTime = e.target.value;
    if (newEndTime > scheduledFor) {
      setScheduledUntil(newEndTime);
    } else {
      alertApi.post({
        message: 'End time must be greater than Start time',
        severity: 'error',
      });
    }
  };

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
        <InputLabel shrink style={{ display: 'flex', alignItems: 'center' }}>
          {scheduledFor ? 'Maintenance Name' : 'Incident Name'}
          <Tooltip title="This name identifies the maintenance or incident and cannot be modified.">
            <HelpOutlineIcon
              fontSize="small"
              style={{ cursor: 'pointer', marginLeft: 4 }}
            />
          </Tooltip>
        </InputLabel>
        <TextField
          fullWidth
          value={name}
          disabled
          style={{ marginBottom: 20 }}
        />

        <FormControl fullWidth style={{ marginBottom: 20 }}>
          <InputLabel shrink style={{ display: 'flex', alignItems: 'center' }}>
            Status
            <Tooltip title="Select the current status of the maintenance or incident.">
              <HelpOutlineIcon
                fontSize="small"
                style={{ cursor: 'pointer', marginLeft: 4 }}
              />
            </Tooltip>
          </InputLabel>
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
          <InputLabel shrink style={{ display: 'flex', alignItems: 'center' }}>
            Impact
            <Tooltip title="Select the level of impact caused by this maintenance or incident.">
              <HelpOutlineIcon
                fontSize="small"
                style={{ cursor: 'pointer', marginLeft: 4 }}
              />
            </Tooltip>
          </InputLabel>
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
            <InputLabel
              shrink
              style={{ display: 'flex', alignItems: 'center' }}
            >
              Start Time (UTC)
              <Tooltip title="This is the scheduled start time in UTC and cannot be modified.">
                <HelpOutlineIcon
                  fontSize="small"
                  style={{ cursor: 'pointer', marginLeft: 4 }}
                />
              </Tooltip>
            </InputLabel>
            <TextField
              fullWidth
              type="datetime-local"
              value={scheduledFor ? `${scheduledFor}`.slice(0, 16) : ''}
              disabled
              InputLabelProps={{ shrink: true }}
            />
            <InputLabel
              shrink
              style={{ display: 'flex', alignItems: 'center', marginTop: 16 }}
            >
              End Time (UTC)
              <Tooltip title="End Time in UTC when the maintenance is expected to finish.">
                <HelpOutlineIcon
                  fontSize="small"
                  style={{ cursor: 'pointer', marginLeft: 4 }}
                />
              </Tooltip>
            </InputLabel>
            <TextField
              fullWidth
              type="datetime-local"
              value={scheduledUntil ? `${scheduledUntil}`.slice(0, 16) : ''}
              onChange={handleEndTimeChange}
              InputLabelProps={{ shrink: true }}
              inputProps={{
                min: `${scheduledFor}`.slice(0, 16),
              }}
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
