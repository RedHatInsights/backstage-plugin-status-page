import { Content, Page } from '@backstage/core-components';
import { alertApiRef, useAnalytics, useApi } from '@backstage/core-plugin-api';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { outageApiRef } from '../api';
import templateData from './../template.json';
import { StatusPageHeader } from './Header';

export const CreateIncident = () => {
  const outageApi = useApi(outageApiRef);
  const alertApi = useApi(alertApiRef);
  const analytics = useAnalytics();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const navigate = useNavigate();
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
  const [components, setComponents] = useState<any>({});
  const [componentStatus, setComponentStatus] = useState<ComponentStatusMap>(
    {},
  );
  const [scheduledAutoCompleted, setScheduledAutoCompleted] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const groupEntries = Object.entries(components ?? {});
  const visibleGroups = showAll ? groupEntries : groupEntries.slice(0, 5);
  const [startDateError, setStartDateError] = useState('');
  const [endDateError, setEndDateError] = useState('');
  const [formTab, setFormTab] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const componentsResponse = await outageApi.fetchComponents();
        setComponents(componentsResponse);
        setIncidentTemplates(templateData);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error loading componenets:', error);
        alertApi.post({
          message: 'Error inloading componenets',
          severity: 'error',
        });
      } finally {
        setPageLoading(false);
      }
    };

    loadData();
  }, [outageApi, alertApi]);

  const getCurrentUTCDateTime = () => new Date().toISOString().slice(0, 16);

  const getMinUTCDateTime = () => {
    const minDate = new Date();
    minDate.setDate(minDate.getUTCDate() - 1);
    return minDate.toISOString().slice(0, 16);
  };

  const getMaxUTCDateTime = () => {
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getUTCFullYear() + 10);
    return maxDate.toISOString().slice(0, 16);
  };

  const handleStartTimeChange = (e: any) => {
    const newStartTime = e.target.value;
    setStartDateError('');
    setStartDate(newStartTime);

    if (newStartTime < getMinUTCDateTime()) {
      setStartDateError('Invalid Start Time');
      setStartDate('');
    } else if (endDate && newStartTime >= endDate) {
      setEndDate('');
    } else setStartDateError('');
  };

  const handleEndTimeChange = (e: any) => {
    const newEndTime = e.target.value;
    setEndDateError('');
    setEndDate(newEndTime);
    if (newEndTime > startDate) setEndDate(newEndTime);
    else {
      setEndDateError('End time must be after start time.');
    }
  };

  const onSubmit = async (incidentData: StatusPageIncident) => {
    setSubmitLoading(true);
    try {
      await outageApi.createIncident(incidentData);
      navigate('/status-page');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error creating incident:', error);
    } finally {
      setSubmitLoading(false);
    }
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

  const handleComponentChangeCheckbox = (componentId: string) => {
    setSelectedComponents(prev => {
      if (prev.includes(componentId)) {
        const newSelected = prev.filter(id => id !== componentId);
        setComponentStatus(prevStatus => {
          const newStatus = { ...prevStatus };
          delete newStatus[componentId];
          return newStatus;
        });
        return newSelected;
      }
      setComponentStatus(prevStatus => ({
        ...prevStatus,
        [componentId]: 'operational',
      }));
      return [...prev, componentId];
    });
  };

  const handleStatusChange = (componentId: string, _status: string) => {
    setComponentStatus(prev => ({
      ...prev,
      [componentId]: _status,
    }));
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
        components: componentStatus,
      });

      analytics.captureEvent('create', 'Maintenance created');
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
        components: componentStatus,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        resolved_at: '',
      });
      analytics.captureEvent('create', 'Incident created');
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
    setComponents({});
    setScheduledAutoCompleted(true);
  };

  return (
    <>
      <Page themeId="tool">
        <>
          <StatusPageHeader
            title="Status Page"
            subtitle="Incident & Maintenance Tracking"
          />
          {pageLoading && (
            <LinearProgress
              sx={{
                width: '110vw',
                marginLeft: '-5vw',
                height: 4,
              }}
            />
          )}
        </>
        {pageLoading ? (
          <Content>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '60vh',
                width: '100%',
              }}
            >
              <LinearProgress sx={{ width: '60%' }} />
            </Box>
          </Content>
        ) : (
          <Content>
            <Box
              sx={{
                width: '50%',
                minWidth: 700,
                m: 3,
                p: 3,
                backgroundColor: 'background.paper',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Grid container spacing={3} direction="column">
                <Grid item>
                  <Tabs
                    value={formTab}
                    indicatorColor="primary"
                    textColor="primary"
                    onChange={(_, value) => {
                      setFormTab(value);
                      setIsMaintenanceForm(value === 1);
                    }}
                    aria-label="outage-form-tabs"
                  >
                    <Tab label="Create Incident" />
                    <Tab label="Schedule Maintenance" />
                  </Tabs>
                </Grid>
                <br />

                {isMaintenanceForm ? (
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={12}>
                      <Grid container direction="column" spacing={3}>
                        <Grid item>
                          <TextField
                            label="Maintenance Name"
                            fullWidth
                            value={topic}
                            onChange={e => setTopic(e.target.value)}
                            required
                          />
                        </Grid>

                        <Grid item>
                          <FormControl fullWidth required>
                            <InputLabel>Status</InputLabel>
                            <Select
                              value={maintenanceStatus}
                              onChange={e =>
                                setMaintenanceStatus(e.target.value as string)
                              }
                            >
                              <MenuItem value="scheduled">Scheduled</MenuItem>
                              <MenuItem value="in_progress">
                                In Progress
                              </MenuItem>
                              <MenuItem value="verifying">Verifying</MenuItem>
                              <MenuItem value="completed">Completed</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>

                        <Grid item>
                          <FormControl fullWidth required>
                            <InputLabel>Impact</InputLabel>
                            <Select
                              value={impactOverride}
                              onChange={e =>
                                setImpactOverride(e.target.value as string)
                              }
                            >
                              <MenuItem value="none">None</MenuItem>
                              <MenuItem value="minor">Minor</MenuItem>
                              <MenuItem value="major">Major</MenuItem>
                              <MenuItem value="critical">Critical</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>

                        <Grid item>
                          <TextField
                            type="datetime-local"
                            label="Start Time (UTC)"
                            fullWidth
                            value={startDate}
                            onChange={handleStartTimeChange}
                            inputProps={{
                              min: getMinUTCDateTime(),
                              max: getMaxUTCDateTime(),
                            }}
                            InputLabelProps={{ shrink: true }}
                            error={!!startDateError}
                            helperText={startDateError}
                            required
                          />
                        </Grid>

                        <Grid item>
                          <TextField
                            type="datetime-local"
                            label="End Time (UTC)"
                            fullWidth
                            value={endDate}
                            onChange={handleEndTimeChange}
                            inputProps={{
                              min: startDate || getCurrentUTCDateTime(),
                              max: getMaxUTCDateTime(),
                            }}
                            InputLabelProps={{ shrink: true }}
                            error={!!endDateError}
                            helperText={endDateError}
                            required
                          />
                        </Grid>

                        <Grid item>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={scheduledAutoCompleted}
                                onChange={e =>
                                  setScheduledAutoCompleted(e.target.checked)
                                }
                              />
                            }
                            label="Auto complete the maintenance"
                          />
                        </Grid>
                        <Grid item>
                          <FormControl fullWidth required>
                            <FormLabel>Select Components</FormLabel>
                            <Box mt={2} />
                            {visibleGroups.map(
                              ([groupName, groupComponents]: any) => (
                                <Accordion key={groupName} elevation={0}>
                                  <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                  >
                                    <Typography>{groupName}</Typography>
                                  </AccordionSummary>
                                  <AccordionDetails>
                                    <List dense>
                                      {groupComponents.map((component: any) => {
                                        const isChecked =
                                          selectedComponents.includes(
                                            component.id,
                                          );
                                        return (
                                          <ListItem
                                            key={component.id}
                                            style={{ width: '100%' }}
                                          >
                                            <Box
                                              sx={{
                                                display: 'grid',
                                                gridTemplateColumns:
                                                  '300px 200px',
                                                alignItems: 'center',
                                                px: 1,
                                              }}
                                            >
                                              <Box
                                                sx={{
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                }}
                                              >
                                                <Checkbox
                                                  edge="start"
                                                  checked={isChecked}
                                                  onChange={() =>
                                                    handleComponentChangeCheckbox(
                                                      component.id,
                                                    )
                                                  }
                                                  tabIndex={-1}
                                                  disableRipple
                                                  size="small"
                                                />
                                                <ListItemText
                                                  primary={component.name}
                                                  primaryTypographyProps={{
                                                    noWrap: true,
                                                  }}
                                                />
                                              </Box>
                                              {isChecked ? (
                                                <Select
                                                  fullWidth
                                                  value={
                                                    componentStatus[
                                                      component.id
                                                    ] || ''
                                                  }
                                                  onChange={e =>
                                                    handleStatusChange(
                                                      component.id,
                                                      e.target.value as string,
                                                    )
                                                  }
                                                  displayEmpty
                                                >
                                                  <MenuItem value="" disabled>
                                                    Select status
                                                  </MenuItem>
                                                  <MenuItem value="major_outage">
                                                    Major Outage
                                                  </MenuItem>
                                                  <MenuItem value="partial_outage">
                                                    Partial Outage
                                                  </MenuItem>
                                                  <MenuItem value="degraded_performance">
                                                    Degraded Performance
                                                  </MenuItem>
                                                  <MenuItem value="operational">
                                                    Operational
                                                  </MenuItem>
                                                  <MenuItem value="under_maintenance">
                                                    Under Maintenance
                                                  </MenuItem>
                                                </Select>
                                              ) : (
                                                <Box sx={{ height: 40 }} />
                                              )}
                                            </Box>
                                          </ListItem>
                                        );
                                      })}
                                    </List>
                                  </AccordionDetails>
                                </Accordion>
                              ),
                            )}

                            {groupEntries.length > 3 && (
                              <Box
                                display="flex"
                                justifyContent="center"
                                mt={2}
                              >
                                <Button
                                  size="small"
                                  onClick={() => {
                                    setShowAll(!showAll);
                                    if (!showAll) {
                                      setTimeout(() => {
                                        window.scrollTo({
                                          top: document.body.scrollHeight,
                                          behavior: 'smooth',
                                        });
                                      }, 100);
                                    }
                                  }}
                                >
                                  {showAll ? 'Show Less' : 'Show All'}
                                </Button>
                              </Box>
                            )}
                          </FormControl>
                        </Grid>
                        <Grid item>
                          <TextField
                            label="Description"
                            fullWidth
                            multiline
                            rows={4}
                            value={maintenanceDescription}
                            onChange={e =>
                              setMaintenanceDescription(e.target.value)
                            }
                            required
                          />
                        </Grid>

                        <Grid
                          container
                          justify="center"
                          spacing={2}
                          style={{ marginTop: 32 }}
                        >
                          <Grid item>
                            <Button
                              variant="outlined"
                              onClick={() => window.history.back()}
                            >
                              Cancel
                            </Button>
                          </Grid>
                          <Grid item>
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={handleSubmit}
                            >
                              Submit
                            </Button>
                          </Grid>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                ) : (
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={12}>
                      <Grid container direction="column" spacing={3}>
                        <Grid item>
                          <FormControl fullWidth>
                            <InputLabel shrink>
                              Select Template
                              <Tooltip title="Choose a predefined template for the incident details.">
                                <HelpOutlineIcon
                                  fontSize="small"
                                  style={{ marginLeft: 8, cursor: 'pointer' }}
                                />
                              </Tooltip>
                            </InputLabel>
                            <Select
                              value={selectedTemplate}
                              onChange={e =>
                                handleTemplateChange(e.target.value as string)
                              }
                            >
                              <MenuItem value="">None</MenuItem>
                              {Object.keys(incidentTemplates).map(key => (
                                <MenuItem key={key} value={key}>
                                  {key}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>

                        <Grid item>
                          <TextField
                            label="Incident Name"
                            fullWidth
                            value={incidentName}
                            onChange={e => setIncidentName(e.target.value)}
                            required
                          />
                        </Grid>

                        <Grid item>
                          <FormControl fullWidth required>
                            <InputLabel>Status</InputLabel>
                            <Select
                              value={status}
                              onChange={e =>
                                setStatus(e.target.value as string)
                              }
                            >
                              <MenuItem value="identified">Identified</MenuItem>
                              <MenuItem value="investigating">
                                Investigating
                              </MenuItem>
                              <MenuItem value="monitoring">Monitoring</MenuItem>
                              <MenuItem value="resolved">Resolved</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>

                        <Grid item>
                          <FormControl fullWidth required>
                            <InputLabel>Impact</InputLabel>
                            <Select
                              value={impactOverride}
                              onChange={e =>
                                setImpactOverride(e.target.value as string)
                              }
                            >
                              <MenuItem value="none">None</MenuItem>
                              <MenuItem value="minor">Minor</MenuItem>
                              <MenuItem value="major">Major</MenuItem>
                              <MenuItem value="critical">Critical</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>

                        <Grid item>
                          <FormControl fullWidth required>
                            <FormLabel>Select Components</FormLabel>
                            <Box mt={2} />
                            {visibleGroups.map(
                              ([groupName, groupComponents]: any) => (
                                <Accordion key={groupName} elevation={0}>
                                  <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                  >
                                    <Typography>{groupName}</Typography>
                                  </AccordionSummary>
                                  <AccordionDetails>
                                    <List dense>
                                      {groupComponents.map((component: any) => {
                                        const isChecked =
                                          selectedComponents.includes(
                                            component.id,
                                          );
                                        return (
                                          <ListItem
                                            key={component.id}
                                            style={{ width: '100%' }}
                                          >
                                            <Box
                                              sx={{
                                                display: 'grid',
                                                gridTemplateColumns:
                                                  '300px 200px',
                                                alignItems: 'center',
                                                px: 1,
                                              }}
                                            >
                                              <Box
                                                sx={{
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                }}
                                              >
                                                <Checkbox
                                                  edge="start"
                                                  checked={isChecked}
                                                  onChange={() =>
                                                    handleComponentChangeCheckbox(
                                                      component.id,
                                                    )
                                                  }
                                                  tabIndex={-1}
                                                  disableRipple
                                                  size="small"
                                                />
                                                <ListItemText
                                                  primary={component.name}
                                                  primaryTypographyProps={{
                                                    noWrap: true,
                                                  }}
                                                />
                                              </Box>
                                              {isChecked ? (
                                                <Select
                                                  fullWidth
                                                  value={
                                                    componentStatus[
                                                      component.id
                                                    ] || ''
                                                  }
                                                  onChange={e =>
                                                    handleStatusChange(
                                                      component.id,
                                                      e.target.value as string,
                                                    )
                                                  }
                                                  displayEmpty
                                                >
                                                  <MenuItem value="" disabled>
                                                    Select status
                                                  </MenuItem>
                                                  <MenuItem value="major_outage">
                                                    Major Outage
                                                  </MenuItem>
                                                  <MenuItem value="partial_outage">
                                                    Partial Outage
                                                  </MenuItem>
                                                  <MenuItem value="degraded_performance">
                                                    Degraded Performance
                                                  </MenuItem>
                                                  <MenuItem value="operational">
                                                    Operational
                                                  </MenuItem>
                                                  <MenuItem value="under_maintenance">
                                                    Under Maintenance
                                                  </MenuItem>
                                                </Select>
                                              ) : (
                                                <Box sx={{ height: 40 }} />
                                              )}
                                            </Box>
                                          </ListItem>
                                        );
                                      })}
                                    </List>
                                  </AccordionDetails>
                                </Accordion>
                              ),
                            )}

                            {groupEntries.length > 3 && (
                              <Box
                                display="flex"
                                justifyContent="center"
                                mt={2}
                              >
                                <Button
                                  size="small"
                                  onClick={() => {
                                    setShowAll(!showAll);
                                    if (!showAll) {
                                      setTimeout(() => {
                                        window.scrollTo({
                                          top: document.body.scrollHeight,
                                          behavior: 'smooth',
                                        });
                                      }, 100);
                                    }
                                  }}
                                >
                                  {showAll ? 'Show Less' : 'Show All'}
                                </Button>
                              </Box>
                            )}
                          </FormControl>
                        </Grid>
                        <Grid item>
                          <TextField
                            label="Description"
                            fullWidth
                            multiline
                            rows={5}
                            value={body}
                            onChange={e => setBody(e.target.value)}
                          />
                        </Grid>
                      </Grid>

                      <Grid
                        container
                        justifyContent="center"
                        spacing={2}
                        style={{ marginTop: 32 }}
                      >
                        <Grid item>
                          <Button
                            variant="outlined"
                            onClick={() => window.history.back()}
                          >
                            Cancel
                          </Button>
                        </Grid>
                        <Grid item>
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSubmit}
                          >
                            Submit
                          </Button>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                )}
              </Grid>
            </Box>
          </Content>
        )}
      </Page>
      <Backdrop
        open={submitLoading}
        sx={{ color: '#fff', zIndex: theme => theme.zIndex.drawer + 1 }}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </>
  );
};

export default CreateIncident;
