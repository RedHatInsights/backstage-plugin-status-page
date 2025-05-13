import { alertApiRef, useAnalytics, useApi } from '@backstage/core-plugin-api';
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
  Switch,
  TextField,
  Tooltip,
} from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import templateData from './../template.json';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';

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
  const [isMaintenanceForm, setIsMaintenanceForm] = useState(false);
  const [topic, setTopic] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [maintenanceDescription, setMaintenanceDescription] = useState('');
  const [maintenanceStatus, setMaintenanceStatus] = useState('');

  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const [components, setComponents] = useState<any | []>([]);
  const [scheduledAutoCompleted, setScheduledAutoCompleted] = useState(true);
  const analytics = useAnalytics();
  const alertApi = useApi(alertApiRef);

  const getCurrentUTCDateTime = () => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  };

  const handleStartTimeChange = (e: any) => {
    const newStartTime = e.target.value;
    setStartDate(newStartTime);
    if (endDate && newStartTime >= endDate) {
      setEndDate('');
    }
  };

  const handleEndTimeChange = (e: any) => {
    const newEndTime = e.target.value;
    if (newEndTime > startDate) {
      setEndDate(newEndTime);
    } else {
      alertApi.post({
        message: 'End time must be greater than Start time',
        severity: 'error',
      });
    }
  };

  useEffect(() => {
    setIncidentTemplates(templateData);
    setComponents(component);
  }, [component]);

  const handleComponentChange = (
    event: React.ChangeEvent<{ value: unknown }>,
  ) => {
    setSelectedComponents(event.target.value as string[]);
  };

  const handleTemplateChange = (templateKey: string) => {
    setSelectedTemplate(templateKey);
    if (!isMaintenanceForm && templateKey && incidentTemplates[templateKey]) {
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
    if (isMaintenanceForm) {
      if (
        !topic ||
        !startDate ||
        !endDate ||
        !maintenanceDescription ||
        !maintenanceStatus ||
        !impactOverride
      ) {
        alertApi.post({
          message: 'All fields are required for maintenance.',
          severity: 'error',
        });
        return;
      }
      onSubmit({
        name: topic,
        status: maintenanceStatus,
        impact_override: impactOverride,
        scheduled_for: startDate,
        started_at: startDate,
        scheduled_until: endDate,
        body: maintenanceDescription,
        component_ids: selectedComponents,
        scheduled_auto_completed: scheduledAutoCompleted,
        notify: true,
      });
      analytics.captureEvent('create', `Maintenance created`);
    } else {
      if (!incidentName || !status || !impactOverride) {
        alertApi.post({
          message:
            'Incident name, status, impact level, and components are required.',
          severity: 'error',
        });
        return;
      }
      onSubmit({
        name: incidentName,
        status,
        impact_override: impactOverride,
        body,
        component_ids: selectedComponents,
        notify: true,
      });
    }
    setIncidentName('');
    setStatus('');
    setImpactOverride('');
    setBody('');
    setSelectedTemplate('');
    setIsMaintenanceForm(false);
    setTopic('');
    setStartDate('');
    setEndDate('');
    setMaintenanceDescription('');
    setMaintenanceStatus('');
    setSelectedComponents([]);
    setComponents([]);
    setScheduledAutoCompleted(true);
    analytics.captureEvent('create', `Incident Created`);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>
        {isMaintenanceForm ? 'Create Maintenance' : 'Create Incident'}
      </DialogTitle>

      <DialogContent>
        <Switch
          checked={isMaintenanceForm}
          onChange={() => setIsMaintenanceForm(!isMaintenanceForm)}
        />
        {!isMaintenanceForm ? 'Create Incident' : 'Schedule Maintenance'}
        {!isMaintenanceForm && (
          <FormControl fullWidth style={{ marginBottom: 20 }}>
            <InputLabel
              shrink
              style={{ display: 'flex', alignItems: 'center' }}
            >
              Select Template
              <Tooltip title="Choose a predefined template for the incident details.">
                <HelpOutlineIcon
                  fontSize="small"
                  style={{ cursor: 'pointer', marginLeft: 4 }}
                />
              </Tooltip>
            </InputLabel>
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
        )}

        {isMaintenanceForm ? (
          <>
            <TextField
              label="Maintenance name"
              fullWidth
              value={topic}
              onChange={e => setTopic(e.target.value)}
              style={{ marginBottom: 20 }}
            />
            <FormControl fullWidth style={{ marginBottom: 20 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={maintenanceStatus}
                onChange={e => setMaintenanceStatus(e.target.value as string)}
              >
                <MenuItem value="scheduled">Scheduled</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="verifying">Verifying</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
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
              type="datetime-local"
              fullWidth
              value={startDate}
              onChange={handleStartTimeChange}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: getCurrentUTCDateTime() }}
              style={{ marginBottom: 20 }}
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
              type="datetime-local"
              fullWidth
              value={endDate}
              onChange={handleEndTimeChange}
              InputLabelProps={{ shrink: true }}
              inputProps={{
                min: startDate || getCurrentUTCDateTime(),
              }}
              style={{ marginBottom: 20 }}
            />

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
                    <Checkbox
                      checked={selectedComponents.indexOf(value.id) > -1}
                    />
                    <ListItemText primary={value.name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Description"
              fullWidth
              value={maintenanceDescription}
              onChange={e => setMaintenanceDescription(e.target.value)}
              multiline
              rows={4}
              style={{ marginBottom: 20 }}
            />
          </>
        ) : (
          <>
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
                    <Checkbox
                      checked={selectedComponents.indexOf(value.id) > -1}
                    />
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
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handleSubmit} color="primary">
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateIncident;
