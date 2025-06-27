import { Content, Page } from '@backstage/core-components';
import { useAnalytics, useApi } from '@backstage/core-plugin-api';
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
  TextField,
  Tooltip,
  Typography
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { outageApiRef } from '../api';
import { StatusPageHeader } from './Header';

export const UpdateIncident = () => {
  const outageApi = useApi(outageApiRef);
  const { incident_id: incidentId } = useParams<{ incident_id: string }>();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');
  const [impactOverride, setImpactOverride] = useState('');
  const [body, setBody] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');
  const [scheduledUntil, setScheduledUntil] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const [components, setComponents] = useState<any>({});
  const [componentStatus, setComponentStatus] = useState<ComponentStatusMap>({});
  const [scheduledAutoCompleted, setScheduledAutoCompleted] = useState(true);
  const [incidentData, setIncidentData] = useState<any>(null);
  const [showAllComponents, setShowAllComponents] = useState(false);
  const [endDateError, setEndDateError] = useState('');

  const incidentComponentIds = new Set(
    incidentData?.components?.map((c: any) => c.id) || []
  );

  const filteredComponents = Object.entries(components ?? {}).reduce(
    (acc: Record<string, any[]>, [groupName, comps]: any) => {
      const matched = comps.filter((comp: any) => incidentComponentIds.has(comp.id));
      if (matched.length > 0) {
        acc[groupName] = matched;
      }
      return acc;
    },
    {}
  );

  const getMaxUTCDateTime = () => {
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getUTCFullYear() + 10);
    return maxDate.toISOString().slice(0, 16);
  };

  const groupEntries = showAllComponents
    ? Object.entries(components ?? {})
    : Object.entries(filteredComponents);

  const handleEndTimeChange = (e: any) => {
    const newEndTime = e.target.value;
    setEndDateError('')
    setScheduledUntil(newEndTime);

    if (newEndTime > scheduledFor) {
      setScheduledUntil(newEndTime);
    } else {
      setEndDateError('End time must be after start time.');
    }
  };

  const handleComponentChangeCheckbox = (componentId: string) => {
    setSelectedComponents((prev) => {
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

  useEffect(() => {
    const loadIncidentAndComponents = async () => {
      try {
        const [incidentResponse, componentsResponse] = await Promise.all([
          outageApi.fetchIncident(incidentId as string),
          outageApi.fetchComponents(),
        ]);
        setComponents(componentsResponse);

        if (incidentResponse) {
          setIncidentData(incidentResponse);
          setName(incidentResponse.name || '');
          setStatus(incidentResponse.status || '');
          setImpactOverride(incidentResponse.impactOverride || '');
          setBody(incidentResponse.body || '');
          setScheduledFor(incidentResponse.scheduledFor || '');
          setScheduledUntil(incidentResponse.scheduledUntil || '');
          setScheduledAutoCompleted(incidentResponse.scheduledAutoCompleted || '');
          setComponents(componentsResponse);
          const selected = incidentResponse?.components?.map((c: any) => c.id);
          const statusMap = incidentResponse.components.reduce((acc, comp: any) => {
            acc[comp.id] = comp.status;
            return acc;
          }, {} as Record<string, string>);
          setSelectedComponents(selected);
          setComponentStatus(statusMap);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error loading incident and components:', error);
        navigate('/status-page');
      } finally {
        setPageLoading(false);
      }
    };
    loadIncidentAndComponents();
  }, [incidentId, outageApi, navigate]);

  const analytics = useAnalytics();

  const handleUpdateSubmit = async (
    id: string,
    updatedData: any,
  ) => {
    setSubmitLoading(true);
    try {
      await outageApi.updateIncident(
        id,
        updatedData,
      );
      navigate('/status-page');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error creating incident:', error);
    } finally {
      setSubmitLoading(false);
    }

  };

  const handleUpdate = () => {
    handleUpdateSubmit(incidentId as string, {
      status,
      impact_override: impactOverride,
      body,
      component_ids: selectedComponents,
      scheduled_until: scheduledUntil,
      scheduled_auto_completed: scheduledAutoCompleted || false,
      components: componentStatus,

    });

    if (scheduledUntil) {
      analytics.captureEvent('update', `Maintenance Updated }`);
    } else {
      analytics.captureEvent('update', `Incident Updated`);
    }
  };

  return (
    <>
      <Page themeId="tool">
        <>
          <StatusPageHeader title="Status Page" subtitle="Incident & Maintenance Tracking" />
          {pageLoading && (
            <LinearProgress sx={{
              width: '110vw',
              marginLeft: '-5vw',
              height: 4,
            }} />
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
                <Grid item >
                  <InputLabel shrink style={{ display: 'flex', alignItems: 'center' }}>
                    {scheduledFor ? 'Maintenance Name' : 'Incident Name'}
                    <Tooltip title="This name identifies the maintenance or incident and cannot be modified.">
                      <HelpOutlineIcon fontSize="small" style={{ cursor: 'pointer', marginLeft: 4 }} />
                    </Tooltip>
                  </InputLabel>
                  <TextField fullWidth value={name} disabled />
                </Grid>
                <Grid item >
                  <FormControl fullWidth>
                    <InputLabel shrink style={{ display: 'flex', alignItems: 'center' }}>
                      Status
                      <Tooltip title="Select the current status of the maintenance or incident.">
                        <HelpOutlineIcon fontSize="small" style={{ cursor: 'pointer', marginLeft: 4 }} />
                      </Tooltip>
                    </InputLabel>
                    <Select
                      value={status}
                      onChange={e => setStatus(e.target.value as string)}
                    >
                      {scheduledFor
                        ? ['scheduled', 'in_progress', 'verifying', 'completed'].map(option => (
                          <MenuItem key={option} value={option}>
                            {option.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                          </MenuItem>
                        ))
                        : ['identified', 'investigating', 'monitoring', 'resolved'].map(option => (
                          <MenuItem key={option} value={option}>
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item >
                  <FormControl fullWidth>
                    <InputLabel shrink style={{ display: 'flex', alignItems: 'center' }}>
                      Impact
                      <Tooltip title="Select the level of impact caused by this maintenance or incident.">
                        <HelpOutlineIcon fontSize="small" style={{ cursor: 'pointer', marginLeft: 4 }} />
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
                </Grid>
                {scheduledFor && (
                  <>
                    <Grid item >
                      <InputLabel shrink style={{ display: 'flex', alignItems: 'center' }}>
                        Start Time (UTC)
                        <Tooltip title="This is the scheduled start time in UTC and cannot be modified.">
                          <HelpOutlineIcon fontSize="small" style={{ cursor: 'pointer', marginLeft: 4 }} />
                        </Tooltip>
                      </InputLabel>
                      <TextField
                        fullWidth
                        type="datetime-local"
                        value={`${scheduledFor}`.slice(0, 16)}
                        disabled
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>

                    <Grid item >
                      <InputLabel shrink style={{ display: 'flex', alignItems: 'center' }}>
                        End Time (UTC)
                        <Tooltip title="End Time in UTC when the maintenance is expected to finish.">
                          <HelpOutlineIcon fontSize="small" style={{ cursor: 'pointer', marginLeft: 4 }} />
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
                          max: getMaxUTCDateTime()
                        }}
                        error={!!endDateError}
                        helperText={endDateError}
                      />
                    </Grid>

                    <Grid item >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={scheduledAutoCompleted}
                            onChange={e => setScheduledAutoCompleted(e.target.checked)}
                          />
                        }
                        label="Auto complete the maintenance"
                      />
                    </Grid>
                  </>
                )}
                <Grid item >
                  <FormControl fullWidth>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <FormLabel component="legend">Select Components</FormLabel>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setShowAllComponents(prev => !prev)}
                      >
                        {showAllComponents
                          ? 'Show Only Incident Components'
                          : 'Show All Components'}
                      </Button>
                    </Box>
                    <Box mt={2} />
                    {groupEntries.map(([groupName, groupComponents]: any) => (
                      <Accordion key={groupName} elevation={0}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography>{groupName}</Typography>
                        </AccordionSummary>
                        <AccordionDetails >
                          <List dense>
                            {groupComponents.map((component: any) => {
                              const isChecked = selectedComponents.includes(component.id);
                              return (
                                <ListItem key={component.id} style={{ width: '100%' }}>
                                  <Box
                                    sx={{
                                      display: 'grid',
                                      gridTemplateColumns: '300px 200px',
                                      alignItems: 'center',
                                      px: 1,
                                    }}
                                  >
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      <Checkbox
                                        edge="start"
                                        checked={isChecked}
                                        onChange={() => handleComponentChangeCheckbox(component.id)}
                                        tabIndex={-1}
                                        disableRipple
                                        size="small"
                                      />
                                      <ListItemText
                                        primary={component.name}
                                        primaryTypographyProps={{ noWrap: true }}

                                      />
                                    </Box>
                                    {isChecked ? (
                                      <Select
                                        fullWidth
                                        value={componentStatus[component.id] || ''}
                                        onChange={e => handleStatusChange(component.id, e.target.value as string)}
                                        displayEmpty
                                      >
                                        <MenuItem value="" disabled>Select status</MenuItem>
                                        <MenuItem value="major_outage">Major Outage</MenuItem>
                                        <MenuItem value="partial_outage">Partial Outage</MenuItem>
                                        <MenuItem value="degraded_performance">Degraded Performance</MenuItem>
                                        <MenuItem value="operational">Operational</MenuItem>
                                        <MenuItem value="under_maintenance">Under Maintenance</MenuItem>
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
                    ))}
                  </FormControl>
                </Grid>
                <Grid item >
                  <TextField
                    label="Description"
                    fullWidth
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    multiline
                    rows={4}
                  />
                </Grid>

                <Grid container justify="center" spacing={2} style={{ marginTop: 32 }}>
                  <Grid item>
                    <Button variant="outlined" onClick={() => window.history.back()}>
                      Cancel
                    </Button>
                  </Grid>
                  <Grid item>
                    <Button variant="contained" color="primary" onClick={handleUpdate}>
                      Submit
                    </Button>
                  </Grid>
                </Grid>
              </Grid>
            </Box>
          </Content>
        )}
      </Page>
      <Backdrop open={submitLoading} sx={{ color: '#fff', zIndex: theme => theme.zIndex.drawer + 1 }}>
        <CircularProgress color="inherit" />
      </Backdrop>

    </>
  );
};

export default UpdateIncident;
