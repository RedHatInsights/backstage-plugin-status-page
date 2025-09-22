import {
  alertApiRef,
  discoveryApiRef,
  fetchApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import CloseIcon from '@material-ui/icons/Close';
import { useEffect, useState } from 'react';
import { MenuProps } from './styles';
import { EmailFormData, InitiateAuditDialogProps } from './types';

export const InitiateAuditDialog = ({
  open,
  onClose,
  applications,
  selectedApplications,
  frequency,
  selectedQuarter,
  selectedYear,
  onFrequencyChange,
  onQuarterChange,
  onYearChange,
  onApplicationsChange,
  onInitiate,
  initiating,
  getQuarterOptions,
  getYearOptions,
}: InitiateAuditDialogProps) => {
  const alertApi = useApi(alertApiRef);
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);

  const [localSelectedApplications, setLocalSelectedApplications] =
    useState<string[]>(selectedApplications);

  // Email form state
  const [emailData, setEmailData] = useState<EmailFormData>({
    to: [],
    cc: [],
    subject: 'Compliance Audit Notification',
    body: '',
  });
  const [newToEmail, setNewToEmail] = useState('');
  const [newCcEmail, setNewCcEmail] = useState('');

  // Sync local state with props when dialog opens
  useEffect(() => {
    if (open) {
      setLocalSelectedApplications(selectedApplications);

      // Pre-populate email data based on selected applications
      const selectedApps = applications.filter(app =>
        selectedApplications.includes(app.id),
      );

      if (selectedApps.length > 0) {
        const appNames = selectedApps.map(app => app.app_name).join(', ');
        const appOwners = selectedApps
          .map(app => app.app_owner)
          .filter((owner, index, arr) => arr.indexOf(owner) === index);

        const defaultBody = `Hi Team,

This is a notification regarding compliance audit for the following applications:

${selectedApps.map(app => `• ${app.app_name}`).join('\n')}

Please review and take necessary actions.

Best regards,
Compliance Team`;

        setEmailData({
          to: appOwners,
          cc: [],
          subject: `Compliance Audit Notification for ${appNames}`,
          body: defaultBody,
        });
      }
    }
  }, [open, selectedApplications, applications]);

  const handleApplicationsChange = (
    event: React.ChangeEvent<{ value: unknown }>,
  ) => {
    const value = event.target.value as string[];
    setLocalSelectedApplications(value);
    onApplicationsChange(value);
  };

  const handleRemoveApplication = (applicationIdToRemove: string) => {
    const updatedSelection = localSelectedApplications.filter(
      id => id !== applicationIdToRemove,
    );
    setLocalSelectedApplications(updatedSelection);
    onApplicationsChange(updatedSelection);
  };

  const getSelectedApplicationDetails = () => {
    return applications.filter(app =>
      localSelectedApplications.includes(app.id),
    );
  };

  const getPeriodDisplay = () => {
    if (frequency === 'quarterly') {
      return `${selectedQuarter} ${selectedYear}`;
    } else if (frequency === 'yearly') {
      return selectedYear.toString();
    }
    return 'Not specified';
  };

  // Email helper functions
  const isValidEmail = (email: string) => /\S+@\S+\.\S+/.test(email);

  const handleAddRecipient = (type: 'to' | 'cc') => {
    const email = type === 'to' ? newToEmail : newCcEmail;
    if (email && isValidEmail(email) && !emailData[type].includes(email)) {
      setEmailData(prev => ({ ...prev, [type]: [...prev[type], email] }));
      if (type === 'to') {
        setNewToEmail('');
      } else {
        setNewCcEmail('');
      }
    } else if (email && !isValidEmail(email)) {
      alertApi.post({
        message: `Invalid email address: ${email}`,
        severity: 'error',
      });
    }
  };

  const handleDeleteRecipient = (type: 'to' | 'cc', emailToDelete: string) => {
    setEmailData(prev => ({
      ...prev,
      [type]: prev[type].filter(email => email !== emailToDelete),
    }));
  };

  const handleInitiateWithEmail = async () => {
    // Validate email data
    if (emailData.to.length === 0) {
      alertApi.post({
        message: 'Please add at least one recipient to the "To" field.',
        severity: 'warning',
      });
      return;
    }
    if (!emailData.subject.trim()) {
      alertApi.post({
        message: 'Subject cannot be empty.',
        severity: 'warning',
      });
      return;
    }
    if (!emailData.body.trim()) {
      alertApi.post({
        message: 'Email body cannot be empty.',
        severity: 'warning',
      });
      return;
    }

    // Send email first
    try {
      const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
      const response = await fetchApi.fetch(`${baseUrl}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailData.to.join(','),
          cc: emailData.cc.join(','),
          subject: emailData.subject,
          html: emailData.body.replace(/\n/g, '<br />'),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      alertApi.post({
        message: 'Email sent successfully!',
        severity: 'success',
      });
    } catch (error) {
      alertApi.post({
        message: 'Failed to send email. Please try again.',
        severity: 'error',
      });
      return;
    }

    // Then initiate audit
    onInitiate(emailData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Initiate Bulk Audit</DialogTitle>
      <DialogContent>
        <Box mt={2}>
          <Typography variant="h6" gutterBottom>
            Audit Configuration
          </Typography>

          <Grid container spacing={3}>
            {/* Applications Multi-Select */}
            <Grid item xs={12}>
              <Box>
                <Box display="flex" alignItems="center" mb={1}>
                  <Typography variant="subtitle2" color="textSecondary">
                    {localSelectedApplications.length} application(s) selected
                  </Typography>
                  {localSelectedApplications.length > 0 && (
                    <Chip
                      size="small"
                      label={`${localSelectedApplications.length} selected`}
                      color="primary"
                      variant="outlined"
                    />
                  )}
                </Box>
                <Box display="flex" alignItems="center">
                  <FormControl fullWidth>
                    <InputLabel>Select Applications</InputLabel>
                    <Select
                      multiple
                      value={localSelectedApplications}
                      onChange={handleApplicationsChange}
                      input={<OutlinedInput label="Select Applications" />}
                      renderValue={selected => (
                        <Box display="flex" flexWrap="wrap">
                          {(selected as string[]).map(value => {
                            const app = applications.find(a => a.id === value);
                            return (
                              <Chip
                                key={value}
                                label={app?.app_name || value}
                                size="small"
                                onDelete={() => handleRemoveApplication(value)}
                                deleteIcon={
                                  <IconButton
                                    size="small"
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleRemoveApplication(value);
                                    }}
                                  >
                                    <CloseIcon fontSize="small" />
                                  </IconButton>
                                }
                              />
                            );
                          })}
                        </Box>
                      )}
                      MenuProps={MenuProps}
                    >
                      {applications.map(app => (
                        <MenuItem key={app.id} value={app.id}>
                          <Checkbox
                            checked={
                              localSelectedApplications.indexOf(app.id) > -1
                            }
                          />
                          <ListItemText
                            primary={app.app_name}
                            secondary={`${app.app_owner} | ${app.cmdb_id}`}
                          />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            </Grid>

            {/* Audit Frequency */}
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth required>
                <InputLabel required>Audit Frequency</InputLabel>
                <Select
                  value={frequency}
                  onChange={e =>
                    onFrequencyChange(e.target.value as 'quarterly' | 'yearly')
                  }
                  required
                >
                  <MenuItem value="quarterly">Quarterly</MenuItem>
                  <MenuItem value="yearly">Yearly</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Quarter Selection */}
            {frequency === 'quarterly' && (
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth required>
                  <InputLabel required>Select Quarter</InputLabel>
                  <Select
                    value={selectedQuarter}
                    onChange={e => onQuarterChange(e.target.value as string)}
                    required
                  >
                    {getQuarterOptions().map(q => (
                      <MenuItem key={q.value} value={q.value}>
                        {q.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {/* Year Selection */}
            {(frequency === 'yearly' || frequency === 'quarterly') && (
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth required>
                  <InputLabel required>Select Year</InputLabel>
                  <Select
                    value={selectedYear}
                    onChange={e => onYearChange(Number(e.target.value))}
                    required
                  >
                    {getYearOptions().map(year => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>

          {/* Review Table */}
          {localSelectedApplications.length > 0 && (
            <Box mt={4}>
              <Typography variant="h6" gutterBottom>
                Review Selected Applications
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Application Name</TableCell>
                      <TableCell>Owner</TableCell>
                      <TableCell>CMDB ID</TableCell>
                      <TableCell>Audit Period</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getSelectedApplicationDetails().map(app => (
                      <TableRow key={app.id}>
                        <TableCell>
                          <Typography
                            variant="body2"
                            style={{ fontWeight: 500 }}
                          >
                            {app.app_name}
                          </Typography>
                        </TableCell>
                        <TableCell>{app.app_owner}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={app.cmdb_id}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={getPeriodDisplay()}
                            color="primary"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label="Pending"
                            style={{
                              backgroundColor: '#E3F2FD',
                              color: '#1565C0',
                              borderColor: '#42A5F5',
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="secondary"
                            onClick={() => handleRemoveApplication(app.id)}
                            title="Remove application"
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box mt={2}>
                <Typography variant="body2" color="textSecondary">
                  Total applications to audit:{' '}
                  <strong>{localSelectedApplications.length}</strong>
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Audit period: <strong>{getPeriodDisplay()}</strong>
                </Typography>
              </Box>
            </Box>
          )}
        </Box>

        {/* Email Section */}
        <Divider style={{ margin: '24px 0' }} />

        <Box>
          <Typography variant="h6" gutterBottom>
            Email Notification
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Email will be sent automatically when audit is initiated
          </Typography>

          <Grid container spacing={3}>
            {/* Recipients */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Recipients
              </Typography>

              <Box mb={2}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  To:
                </Typography>
                <Box display="flex" alignItems="center" mb={1}>
                  <TextField
                    size="small"
                    variant="outlined"
                    placeholder="Add email address"
                    value={newToEmail}
                    onChange={e => setNewToEmail(e.target.value)}
                    onKeyPress={e => {
                      if (e.key === 'Enter') {
                        handleAddRecipient('to');
                        e.preventDefault();
                      }
                    }}
                    style={{ flex: 1 }}
                  />
                  <IconButton
                    onClick={() => handleAddRecipient('to')}
                    size="small"
                    disabled={!newToEmail}
                    style={{ marginLeft: 8 }}
                  >
                    <AddIcon />
                  </IconButton>
                </Box>
                <Box display="flex" flexWrap="wrap" style={{ gap: 8 }}>
                  {emailData.to.map(email => (
                    <Chip
                      key={email}
                      label={email}
                      onDelete={() => handleDeleteRecipient('to', email)}
                      size="small"
                    />
                  ))}
                </Box>
              </Box>

              <Box mb={2}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Cc:
                </Typography>
                <Box display="flex" alignItems="center" mb={1}>
                  <TextField
                    size="small"
                    variant="outlined"
                    placeholder="Add email address"
                    value={newCcEmail}
                    onChange={e => setNewCcEmail(e.target.value)}
                    onKeyPress={e => {
                      if (e.key === 'Enter') {
                        handleAddRecipient('cc');
                        e.preventDefault();
                      }
                    }}
                    style={{ flex: 1 }}
                  />
                  <IconButton
                    onClick={() => handleAddRecipient('cc')}
                    size="small"
                    disabled={!newCcEmail}
                    style={{ marginLeft: 8 }}
                  >
                    <AddIcon />
                  </IconButton>
                </Box>
                <Box display="flex" flexWrap="wrap" style={{ gap: 8 }}>
                  {emailData.cc.map(email => (
                    <Chip
                      key={email}
                      label={email}
                      onDelete={() => handleDeleteRecipient('cc', email)}
                      size="small"
                    />
                  ))}
                </Box>
              </Box>
            </Grid>

            {/* Subject */}
            <Grid item xs={12}>
              <TextField
                label="Subject"
                variant="outlined"
                fullWidth
                size="small"
                value={emailData.subject}
                onChange={e =>
                  setEmailData(prev => ({ ...prev, subject: e.target.value }))
                }
              />
            </Grid>

            {/* Body */}
            <Grid item xs={12}>
              <TextField
                label="Email Body"
                variant="outlined"
                fullWidth
                multiline
                rows={6}
                value={emailData.body}
                onChange={e =>
                  setEmailData(prev => ({ ...prev, body: e.target.value }))
                }
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleInitiateWithEmail}
          disabled={
            initiating ||
            localSelectedApplications.length === 0 ||
            !frequency ||
            (frequency === 'quarterly' && !selectedQuarter) ||
            emailData.to.length === 0 ||
            !emailData.subject.trim() ||
            !emailData.body.trim()
          }
        >
          {initiating
            ? 'Initiating Audit & Sending Email...'
            : `Initiate ${localSelectedApplications.length} Audit(s) & Send Email`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
