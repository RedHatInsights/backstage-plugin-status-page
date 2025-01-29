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
import templateData from './../template.json';

const CreateIncident: React.FC<CreateIncidentProps> = ({
  component,
  open,
  onClose,
  onSubmit,
}) => {
  const [incidentName, setIncidentName] = useState('');
  const [status, setStatus] = useState('');
  const [impactOverride, setImpactOverride] = useState('');
  const [body, setBody] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [incidentTemplates, setIncidentTemplates] = useState<
    Record<string, any>
  >({});
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const [components, setComponents] = useState<any | []>([]);

  useEffect(() => {
    setIncidentTemplates(templateData);
    setComponents(component);
  }, [component]);

  const handleTemplateChange = (templateKey: string) => {
    setSelectedTemplate(templateKey);
    if (templateKey && incidentTemplates[templateKey]) {
      const template = incidentTemplates[templateKey];
      setIncidentName(template.name);
      setImpactOverride(template.impactOverride);
      setStatus(template.status);
      setBody(template.body);
    } else {
      setIncidentName('');
      setImpactOverride('');
      setStatus('');
      setBody('');
    }
  };

  const handleComponentChange = (
    event: React.ChangeEvent<{ value: unknown }>,
  ) => {
    setSelectedComponents(event.target.value as string[]);
  };

  const handleSubmit = () => {
    onSubmit({
      name: incidentName,
      status,
      impact_override: impactOverride,
      body,
      component_ids: selectedComponents, // Store the selected component IDs
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Create Incident</DialogTitle>
      <DialogContent>
        <FormControl fullWidth style={{ marginBottom: 20 }}>
          <InputLabel>Select Template</InputLabel>
          <Select
            value={selectedTemplate}
            onChange={e => handleTemplateChange(e.target.value as string)}
          >
            <MenuItem value="">None</MenuItem>
            {Object.keys(incidentTemplates).map(key => (
              <MenuItem key={key} value={key}>
                {key}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Incident Name"
          fullWidth
          value={incidentName}
          onChange={e => setIncidentName(e.target.value)}
          style={{ marginBottom: 20 }}
        />

        <FormControl fullWidth style={{ marginBottom: 20 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={status}
            onChange={e => setStatus(e.target.value as string)}
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
        <Button onClick={handleSubmit} color="primary">
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateIncident;
