import React, { useState } from 'react';
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

// TODO : To be changed later after the discussion
const incidentTemplates: Record<string, any> = {
  'SSO Issue': {
    name: 'SSO Issue',
    impactOverride: 'major',
    status: 'resolved',
    body: 'SSO Issue in Production',
  },
  'Akamai Issue': {
    name: 'Akamai Issue',
    impactOverride: 'major',
    status: 'resolved',
    body: 'Akamai issue in Production',
  },
};

const CreateIncident: React.FC<CreateIncidentProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const [incidentName, setIncidentName] = useState('');
  const [status, setStatus] = useState('');
  const [impactOverride, setImpactOverride] = useState('');
  const [body, setBody] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');

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

  const handleSubmit = () => {
    onSubmit({
      name: incidentName,
      status,
      impact_override: impactOverride,
      body,
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

        <TextField
          label="Description"
          fullWidth
          value={body}
          onChange={e => setBody(e.target.value)}
          multiline
          rows={4}
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
