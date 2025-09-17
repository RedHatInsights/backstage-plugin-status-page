import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  OutlinedInput,
  Checkbox,
  ListItemText,
  IconButton,
  TextField,
  Tabs,
  Tab,
  CircularProgress,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import AddIcon from '@material-ui/icons/Add';
import EditIcon from '@material-ui/icons/Edit';
import VisibilityIcon from '@material-ui/icons/Visibility';
import { useStyles, MenuProps } from './styles';
import {
  TwoStepAuditDialogProps,
  EmailFormData,
  AuditResult,
  RawAuditResult,
} from './types';
import {
  discoveryApiRef,
  fetchApiRef,
  alertApiRef,
  useApi,
} from '@backstage/core-plugin-api';

export const TwoStepAuditDialog: React.FC<TwoStepAuditDialogProps> = ({
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
  getQuarterOptions,
  getYearOptions,
}) => {
  const classes = useStyles();
  const alertApi = useApi(alertApiRef);
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);

  const [activeTab, setActiveTab] = useState(0);
  const [localSelectedApplications, setLocalSelectedApplications] =
    useState<string[]>(selectedApplications);
  const [step1Completed, setStep1Completed] = useState(false);
  const [step1Error, setStep1Error] = useState<string>('');

  // Email form state
  const [emailData, setEmailData] = useState<EmailFormData>({
    to: [],
    cc: [],
    subject: '',
    body: '',
  });
  const [newToEmail, setNewToEmail] = useState('');
  const [newCcEmail, setNewCcEmail] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [isEditingBody, setIsEditingBody] = useState(false);
  const [initiatingAudits, setInitiatingAudits] = useState(false);
  const [emailTemplate] = useState({
    greeting: 'Hello Team,',
    mainContent:
      'An audit activity has been successfully initiated. Please find the details below.',
    table: '',
    closing: 'Best regards,\nCompliance Team',
  });

  // Generate email body from template
  const generateEmailFromTemplate = () => {
    const template = `
<p><strong>{{greeting}}</strong></p>

<p>{{mainContent}}</p>

{{table}}

<p>{{closing}}</p>
    `.trim();

    return template
      .replace('{{greeting}}', emailTemplate.greeting)
      .replace('{{mainContent}}', emailTemplate.mainContent)
      .replace('{{table}}', emailTemplate.table)
      .replace('{{closing}}', emailTemplate.closing.replace(/\n/g, '<br>'));
  };

  const generateEmailTemplate = (userInput: {
    title?: string;
    body?: string;
  }) => {
    const template = `
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; }
      h1 { color: #2c3e50; }
    </style>
  </head>
  <body>
    {{body}}
  </body>
</html>`;

    const defaults = {
      title: 'Audit Activity Initiated',
      body: 'An audit activity has been successfully initiated. Please find the details below.',
    };

    return template.replace('{{body}}', userInput.body || defaults.body);
  };

  const generateEmailBody = (
    results: AuditResult[],
    mainTicket: string,
  ): string => {
    const jiraBaseUrl = 'https://jira.company.com/browse';

    const tableHtml = `
      <div style="margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd; font-family: Arial, sans-serif; font-size: 12px;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Jira</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Ticket Description</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Status</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Assignee</th>
            </tr>
          </thead>
          <tbody>
            ${results
              .map((result, index) => {
                const app = applications.find(
                  application => application.app_name === result.app_name,
                );
                return `
              <tr style="background-color: ${
                index % 2 === 0 ? '#ffffff' : '#f8f9fa'
              };">
                <td style="border: 1px solid #ddd; padding: 8px; font-weight: 500;">${
                  result.jira_ticket && result.jira_ticket !== 'N/A'
                    ? `<a href="${jiraBaseUrl}/${result.jira_ticket}" style="color: #007bff; text-decoration: none;">${result.jira_ticket}</a>`
                    : '<span style="color: #666; font-style: italic;">N/A</span>'
                }</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${
                  result.app_name
                }</td>
                <td style="border: 1px solid #ddd; padding: 8px;">In Progress</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${
                  app?.app_owner || 'N/A'
                }</td>
              </tr>
            `;
              })
              .join('')}
          </tbody>
        </table>
      </div>
    `;

    const selectedApps = applications.filter(app =>
      localSelectedApplications.includes(app.id),
    );
    const appNames = selectedApps.map(app => app.app_name).join(', ');
    const frequencyText = frequency === 'quarterly' ? 'Quarterly' : 'Yearly';
    const periodText =
      frequency === 'quarterly'
        ? `${selectedQuarter}-${selectedYear}`
        : selectedYear.toString();

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // 30 days from now
    const formattedDueDate = dueDate.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const emailContent = `Hi Leads,<br><br>

Request you to please Initiate & complete the <strong>"${frequencyText} Access Review exercise for ${appNames}"</strong> for ${periodText} and maintain/document all the evidence accordingly (without any deviation) as we did for the last quarter. Reference guidelines and materials are attached to the ticket below. Request you to please complete this activity by <strong>${formattedDueDate}</strong> (Including all the evidence and management sign-off)<br><br>

<strong>Important</strong> - Recent audit experience shows auditors very keenly observe the below points. please double check them before closing the activity<br><br>

<strong>1)</strong> Please use the <a href="http://localhost:3000/audit-access-manager" style="color: #007bff; text-decoration: none;"><strong>Audit Access Manager plugin</strong></a> to access and complete the audit activity<br>
<strong>2)</strong> If you are rejecting an access of a user, then make sure that the <strong>user access is removed from both Rover and GitLab</strong> (or whatever sources) and the <strong>status is completed before final sign-off is being provided</strong>.<br>
<strong>3)</strong> For each access deletion, there should be <strong>a ticket and proper documentation of the access removal process</strong>.<br><br>

Tickets assigned to you can be found under the epic - ${
      mainTicket && mainTicket !== 'N/A'
        ? `<a href="${jiraBaseUrl}/${mainTicket}" style="color: #007bff; text-decoration: none;"><strong>${mainTicket}</strong></a>`
        : '<span style="color: #666; font-style: italic;">N/A (Jira creation failed)</span>'
    }<br><br>

${tableHtml}<br><br>

<a href="https://docs.google.com/document/d/1WcwM71Xrlgrb9mTNhcrWISedzTJFyzNWArShW42wd8g/edit?usp=sharing" style="color: #007bff; text-decoration: none;"><strong>Key Links & Guidance for your reference</strong></a><br><br>

<strong>Note for the Quarterly Database User Access reviews</strong> - Requesting DB owners to please wait for the DBA team (Krishna Maddula & Srini Are) to approve the same post which you can review the user access listing and take the next steps/approve accordingly. The <strong>Target Date is the same ${formattedDueDate}</strong><br><br>

Feel free to reach out to me in case of any questions<br><br>

Thanks & Regards<br>
Audit and Compliance Team`;

    return generateEmailTemplate({
      body: emailContent,
    });
  };

  // Update emailData.body when template changes
  useEffect(() => {
    setEmailData(prev => ({ ...prev, body: generateEmailFromTemplate() }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailTemplate]);

  useEffect(() => {
    if (open) {
      setLocalSelectedApplications(selectedApplications);
      setActiveTab(0);
      setStep1Completed(false);
      setStep1Error('');
      setNewToEmail('');
      setNewCcEmail('');
      setSendingEmail(false);
      setIsEditingBody(false);
      setInitiatingAudits(false);
      // Reset email data to empty state
      setEmailData({
        to: [],
        cc: [],
        subject: '',
        body: '',
      });
    }
  }, [open, selectedApplications]);

  const handleApplicationsChange = (
    event: React.ChangeEvent<{ value: unknown }>,
  ) => {
    const value = event.target.value as string[];
    setLocalSelectedApplications(value);
    onApplicationsChange(value);
  };

  const handleStep1Submit = async () => {
    if (localSelectedApplications.length === 0) {
      setStep1Error('Please select at least one application');
      return;
    }

    if (!frequency || (frequency === 'quarterly' && !selectedQuarter)) {
      setStep1Error('Please complete all audit configuration fields');
      return;
    }

    setInitiatingAudits(true);
    try {
      setStep1Error('');
      const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');

      const period =
        frequency === 'quarterly'
          ? `${selectedQuarter}-${selectedYear}`
          : selectedYear.toString();

      const auditRequests = localSelectedApplications.map(applicationId => {
        const application = applications.find(app => app.id === applicationId);
        return {
          application_id: applicationId,
          app_name: application?.app_name || '',
          frequency,
          period,
          initiated_by: 'compliance-manager',
        };
      });

      const response = await fetchApi.fetch(
        `${baseUrl}/compliance/bulk-initiate-audits`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ audits: auditRequests }),
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to initiate audits: ${response.statusText}`);
      }

      const result = await response.json();

      // Extract audit results from the response
      const createdAudits: RawAuditResult[] = result.created_audits || [];
      const results: AuditResult[] = createdAudits.map(
        (audit: RawAuditResult) => {
          // Handle Jira ticket extraction with proper fallbacks
          let jiraTicketKey = 'N/A';

          if (audit.jira_creation_failed) {
            jiraTicketKey = 'N/A';
          } else if (audit.jira_ticket) {
            // Handle both object format {key, id, status, self} and string format
            if (typeof audit.jira_ticket === 'string') {
              jiraTicketKey = audit.jira_ticket;
            } else if (audit.jira_ticket.key) {
              jiraTicketKey = audit.jira_ticket.key;
            } else {
              jiraTicketKey = 'N/A';
            }
          }

          return {
            app_name: audit.app_name,
            frequency: audit.frequency,
            period: audit.period,
            jira_ticket: jiraTicketKey,
            status: audit.status,
          };
        },
      );

      // Use the first valid Jira ticket as the main ticket, or 'N/A' if none exist
      const mainTicket =
        results.find(auditResult => auditResult.jira_ticket !== 'N/A')
          ?.jira_ticket || 'N/A';

      setStep1Completed(true);

      // Pre-populate email data
      const selectedApps = applications.filter(app =>
        localSelectedApplications.includes(app.id),
      );
      const appOwners = selectedApps
        .map(app => (app as any).app_owner_email)
        .filter((email, index, arr) => email && arr.indexOf(email) === index);

      const periodText =
        frequency === 'quarterly'
          ? `${selectedQuarter}-${selectedYear}`
          : selectedYear.toString();

      const emailTitle = `[Action Required] ${
        frequency === 'quarterly' ? 'Quarterly' : 'Yearly'
      } Access Reviews ${periodText} - ${selectedApps
        .map(app => app.app_name)
        .join(', ')}`;
      const emailBody = generateEmailBody(results, mainTicket);

      setEmailData({
        to: appOwners,
        cc: [],
        subject: emailTitle,
        body: emailBody,
      });

      // Move to Tab 2
      setActiveTab(1);

      alertApi.post({
        message: `Successfully initiated ${localSelectedApplications.length} audit(s)`,
        severity: 'success',
        display: 'transient',
      });
    } catch (error) {
      setStep1Error(
        error instanceof Error ? error.message : 'Failed to initiate audits',
      );
    } finally {
      setInitiatingAudits(false);
    }
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
        display: 'transient',
      });
    }
  };

  const handleDeleteRecipient = (type: 'to' | 'cc', emailToDelete: string) => {
    setEmailData(prev => ({
      ...prev,
      [type]: prev[type].filter(email => email !== emailToDelete),
    }));
  };

  const handleSendEmail = async () => {
    if (emailData.to.length === 0) {
      alertApi.post({
        message: 'Please add at least one recipient to the "To" field.',
        severity: 'warning',
        display: 'transient',
      });
      return;
    }
    if (!emailData.subject.trim()) {
      alertApi.post({
        message: 'Subject cannot be empty.',
        severity: 'warning',
        display: 'transient',
      });
      return;
    }
    if (!emailData.body.trim()) {
      alertApi.post({
        message: 'Email body cannot be empty.',
        severity: 'warning',
        display: 'transient',
      });
      return;
    }

    setSendingEmail(true);
    try {
      const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
      const response = await fetchApi.fetch(`${baseUrl}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailData.to.join(','),
          cc: emailData.cc.join(','),
          subject: emailData.subject,
          html: emailData.body,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      alertApi.post({
        message: 'Email sent successfully!',
        severity: 'success',
        display: 'transient',
      });

      onInitiate();
      onClose();
    } catch (error) {
      alertApi.post({
        message: 'Failed to send email. Please try again.',
        severity: 'error',
        display: 'transient',
      });
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle className={classes.dialogTitle}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Two-Step Audit Process</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent className={classes.dialogContent}>
        {/* Tabs */}
        <Box mb={3}>
          <Tabs
            value={activeTab}
            onChange={(_e, newValue) => {
              if (newValue === 1 && !step1Completed) return; // Prevent navigation to Tab 2
              setActiveTab(newValue);
            }}
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab label="Step 1: Initiate Audit" />
            <Tab label="Step 2: Send Email" disabled={!step1Completed} />
          </Tabs>
        </Box>

        {/* Tab 1: Initiate Audit */}
        {activeTab === 0 && (
          <Box>
            {step1Error && (
              <Box
                style={{
                  backgroundColor: '#ffebee',
                  color: '#c62828',
                  padding: '12px',
                  borderRadius: '4px',
                  marginBottom: '16px',
                  border: '1px solid #ffcdd2',
                }}
              >
                <Typography variant="body2" style={{ fontWeight: 500 }}>
                  {step1Error}
                </Typography>
              </Box>
            )}

            <Typography variant="h6" className={classes.sectionTitle}>
              Select Applications
            </Typography>

            <FormControl
              fullWidth
              variant="outlined"
              className={classes.formControl}
            >
              <InputLabel id="select-applications-label">
                Applications
              </InputLabel>
              <Select
                labelId="select-applications-label"
                multiple
                value={localSelectedApplications}
                onChange={handleApplicationsChange}
                input={<OutlinedInput label="Applications" />}
                renderValue={selected => (
                  <Box className={classes.chips}>
                    {(selected as string[]).map(value => {
                      const app = applications.find(a => a.id === value);
                      return (
                        <Chip
                          key={value}
                          label={app?.app_name || value}
                          className={classes.chip}
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
                      checked={localSelectedApplications.indexOf(app.id) > -1}
                    />
                    <ListItemText
                      primary={app.app_name}
                      secondary={app.app_owner}
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Typography
              variant="h6"
              className={classes.sectionTitle}
              style={{ marginTop: 24 }}
            >
              Audit Configuration
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth variant="outlined" margin="normal">
                  <InputLabel>Frequency</InputLabel>
                  <Select
                    value={frequency}
                    onChange={e =>
                      onFrequencyChange(
                        e.target.value as 'quarterly' | 'yearly' | '',
                      )
                    }
                    label="Frequency"
                  >
                    <MenuItem value="quarterly">Quarterly</MenuItem>
                    <MenuItem value="yearly">Yearly</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {frequency === 'quarterly' && (
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth variant="outlined" margin="normal">
                    <InputLabel>Quarter</InputLabel>
                    <Select
                      value={selectedQuarter}
                      onChange={e => onQuarterChange(e.target.value as string)}
                      label="Quarter"
                    >
                      {getQuarterOptions().map(option => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              <Grid item xs={12} md={4}>
                <FormControl fullWidth variant="outlined" margin="normal">
                  <InputLabel>Year</InputLabel>
                  <Select
                    value={selectedYear}
                    onChange={e => onYearChange(Number(e.target.value))}
                    label="Year"
                  >
                    {getYearOptions().map(year => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {localSelectedApplications.length > 0 && (
              <Box mt={4}>
                <Typography variant="h6" className={classes.sectionTitle}>
                  Selected Applications ({localSelectedApplications.length})
                </Typography>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>App Name</TableCell>
                        <TableCell>App Owner</TableCell>
                        <TableCell>Frequency</TableCell>
                        <TableCell>Period</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {localSelectedApplications.map(appId => {
                        const app = applications.find(a => a.id === appId);
                        const period =
                          frequency === 'quarterly'
                            ? `${selectedQuarter}-${selectedYear}`
                            : selectedYear.toString();
                        return (
                          app && (
                            <TableRow key={app.id}>
                              <TableCell>{app.app_name}</TableCell>
                              <TableCell>{app.app_owner}</TableCell>
                              <TableCell>
                                {frequency === 'quarterly'
                                  ? 'Quarterly'
                                  : 'Yearly'}
                              </TableCell>
                              <TableCell>{period}</TableCell>
                            </TableRow>
                          )
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Box>
        )}

        {/* Tab 2: Send Email */}
        {activeTab === 1 && (
          <Box>
            <Typography variant="h6" className={classes.sectionTitle}>
              Email Notification
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Review and send email notification about the initiated audits
            </Typography>

            <Grid container spacing={3}>
              {/* Recipients */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Recipients
                </Typography>

                <Box mb={2}>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    gutterBottom
                  >
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
                        className={classes.emailChip}
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>

                <Box mb={2}>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    gutterBottom
                  >
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
                        className={classes.emailChip}
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
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={2}
                >
                  <Typography variant="subtitle2">Email Body</Typography>
                  <IconButton
                    size="small"
                    onClick={() => setIsEditingBody(!isEditingBody)}
                    title={isEditingBody ? 'Preview' : 'Edit'}
                    style={{
                      backgroundColor: isEditingBody ? '#e3f2fd' : '#f5f5f5',
                      color: isEditingBody ? '#1976d2' : '#666',
                    }}
                  >
                    {isEditingBody ? <VisibilityIcon /> : <EditIcon />}
                  </IconButton>
                </Box>

                {isEditingBody ? (
                  <TextField
                    label="Edit HTML Content"
                    variant="outlined"
                    fullWidth
                    multiline
                    rows={12}
                    value={emailData.body}
                    onChange={e =>
                      setEmailData(prev => ({ ...prev, body: e.target.value }))
                    }
                    placeholder="Edit HTML content here..."
                    style={{ fontFamily: 'monospace', fontSize: '12px' }}
                  />
                ) : (
                  <Box
                    style={{
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      padding: '20px',
                      minHeight: '300px',
                      backgroundColor: '#fafafa',
                      overflow: 'auto',
                      position: 'relative',
                    }}
                  >
                    <Box
                      dangerouslySetInnerHTML={{ __html: emailData.body }}
                      style={{
                        fontFamily: 'Arial, sans-serif',
                        lineHeight: '1.6',
                        color: '#333',
                      }}
                    />
                    {!emailData.body.trim() && (
                      <Box
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          color: '#999',
                          fontSize: '14px',
                        }}
                      >
                        Click the edit icon to add email content
                      </Box>
                    )}
                  </Box>
                )}
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>

      <DialogActions className={classes.dialogActions}>
        <Button onClick={onClose} color="default" variant="outlined">
          Cancel
        </Button>

        {activeTab === 0 && (
          <Button
            onClick={handleStep1Submit}
            color="primary"
            variant="contained"
            disabled={
              initiatingAudits ||
              localSelectedApplications.length === 0 ||
              !frequency ||
              (frequency === 'quarterly' && !selectedQuarter)
            }
          >
            {initiatingAudits ? (
              <>
                <CircularProgress size={20} style={{ marginRight: 8 }} />
                Initiating Audits & Creating Jira Tickets...
              </>
            ) : (
              `Initiate ${localSelectedApplications.length} Audit(s) & Create Jira Tickets`
            )}
          </Button>
        )}

        {activeTab === 1 && (
          <Button
            onClick={handleSendEmail}
            color="primary"
            variant="contained"
            disabled={
              sendingEmail ||
              emailData.to.length === 0 ||
              !emailData.subject.trim() ||
              !emailData.body.trim()
            }
          >
            {sendingEmail ? (
              <>
                <CircularProgress size={20} style={{ marginRight: 8 }} />
                Sending Email...
              </>
            ) : (
              'Send Email'
            )}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
