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
  Checkbox,
  ListItemText,
} from '@material-ui/core';

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

  useEffect(() => {
    if (incidentData) {
      setName(incidentData.name || '');
      setStatus(incidentData.status || '');
      setImpactOverride(incidentData.impactOverride || '');
      setBody(incidentData.body || '');
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

  const handleUpdate = () => {
    onUpdate(incidentId, {
      status,
      impact_override: impactOverride,
      body,
      component_ids: selectedComponents, // Send the selected component IDs
    });
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
            <MenuItem value="identified">Identified</MenuItem>
            <MenuItem value="investigating">Investigating</MenuItem>
            <MenuItem value="monitoring">Monitoring</MenuItem>
            <MenuItem value="resolved">Resolved</MenuItem>
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

        <FormControl fullWidth style={{ marginBottom: 20 }}>
          <InputLabel>Select Components</InputLabel>
          <Select
            multiple
            value={selectedComponents}
            onChange={handleComponentChange}
            renderValue={(selected: any) => (
              <div>
                {selected
                  .map((id: string) => {
                    const data = components.find((c: any) => c.id === id);
                    return data ? data.name : null;
                  })
                  .join(', ')}
              </div>
            )}
          >
            {components.map((value: any) => (
              <MenuItem key={value.id} value={value.id}>
                <Checkbox checked={selectedComponents.indexOf(value.id) > -1} />
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
