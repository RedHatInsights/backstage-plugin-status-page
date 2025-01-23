import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from '@material-ui/core';

const UpdateIncident: React.FC<UpdateIncidentProps> = ({
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

  // Only update state when incidentData changes or modal opens
  useEffect(() => {
    if (incidentData) {
      setName(incidentData.name || '');
      setStatus(incidentData.status || '');
      setImpactOverride(incidentData.impactOverride || '');
      setBody(incidentData.body || '');
    }
  }, [incidentData]);

  const handleUpdate = () => {
    onUpdate(incidentId, { status, impact_override: impactOverride, body });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Update Incident</DialogTitle>
      <DialogContent>
        <TextField
          label="Incident Name"
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
            <MenuItem value="investigating">Investigating</MenuItem>
            <MenuItem value="monitoring">Monitoring</MenuItem>
            <MenuItem value="resolved">Resolved</MenuItem>
            <MenuItem value="identified">Identified</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth style={{ marginBottom: 20 }}>
          <InputLabel>Impact</InputLabel>
          <Select
            value={impactOverride}
            onChange={e => setImpactOverride(e.target.value as string)}
            label="Impact"
          >
            <MenuItem value="none">None</MenuItem>
            <MenuItem value="minor">Minor</MenuItem>
            <MenuItem value="major">Major</MenuItem>
            <MenuItem value="critical">Critical</MenuItem>
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
