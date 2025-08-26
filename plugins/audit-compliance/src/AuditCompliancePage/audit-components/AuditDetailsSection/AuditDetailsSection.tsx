import {
  Breadcrumbs,
  Content,
  GroupIcon,
  Header,
  HeaderLabel,
  Page,
} from '@backstage/core-components';
import {
  alertApiRef,
  discoveryApiRef,
  fetchApiRef,
  identityApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@material-ui/core';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import AssessmentIcon from '@material-ui/icons/Assessment';
import PersonIcon from '@material-ui/icons/Person';
import TimelineIcon from '@material-ui/icons/Timeline';
import VpnKeyIcon from '@material-ui/icons/VpnKey';
import { Alert } from '@material-ui/lab';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AuditActivityStream } from './AuditActivityStream/AuditActivityStream';
import { useStyles } from './AuditDetailsSection.styles';
import RoverAuditTable from './AuditTable/RoverAuditTable/RoverAuditTable';
import ServiceAccountAccessReviewTable from './AuditTable/ServiceAccountAccessReviewTable/ServiceAccountAccessReviewTable';

export const AuditDetailsSection = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const { app_name, frequency, period } = useParams<{
    app_name: string;
    frequency: string;
    period: string;
  }>();
  const [tabIndex, setTabIndex] = useState(0);
  const [userCounts, setUserCounts] = useState({
    completed: 0,
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [serviceCounts, setServiceCounts] = useState({
    completed: 0,
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [isFinalSignedOff, setIsFinalSignedOff] = useState(false);
  const [isAppOwner, setIsAppOwner] = useState(false);
  const [isAppDelegate, setIsAppDelegate] = useState(false);
  const [currentUser, setCurrentUser] = useState('');
  const [appOwnerEmail, setAppOwnerEmail] = useState<string>('');
  const [signOffDialogOpen, setSignOffDialogOpen] = useState(false);
  const [emailReminderDialogOpen, setEmailReminderDialogOpen] = useState(false);
  const [isAuditCompleted, setIsAuditCompleted] = useState(false);
  const [statusChecked, setStatusChecked] = useState(false);
  const [ownerChecked, setOwnerChecked] = useState(false);
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
  const alertApi = useApi(alertApiRef);
  const identityApi = useApi(identityApiRef);

  useEffect(() => {
    setStatusChecked(false);
    setOwnerChecked(false);
    const fetchAuditStatus = async () => {
      try {
        const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
        const url = `${baseUrl}/audits?app_name=${encodeURIComponent(
          app_name || '',
        )}&frequency=${encodeURIComponent(
          frequency || '',
        )}&period=${encodeURIComponent(period || '')}`;
        const response = await fetchApi.fetch(url);
        const data = await response.json();
        if (data && data.length > 0) {
          const audit = data[0];
          setIsFinalSignedOff(audit.status === 'access_review_complete');
          setIsAuditCompleted(audit.progress === 'completed');
        } else {
          setIsFinalSignedOff(false);
          setIsAuditCompleted(false);
        }
        setStatusChecked(true);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching audit status:', error);
        setStatusChecked(true);
      }
    };

    const checkAppOwnerOrDelegate = async () => {
      try {
        const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
        const response = await fetchApi.fetch(
          `${baseUrl}/application-details/${encodeURIComponent(
            app_name || '',
          )}`,
        );
        const data = await response.json();
        const owners = [
          data.app_owner,
          data.app_owner_email?.split('@')[0],
        ].filter(Boolean);

        setAppOwnerEmail(data.app_owner_email || '');

        const identity = await identityApi.getBackstageIdentity();
        const currentUserRef = identity.userEntityRef;
        setCurrentUser(currentUserRef);

        // Check if current user is the application owner
        const isOwner = owners.some(owner =>
          currentUserRef.toLowerCase().includes(owner?.toLowerCase() || ''),
        );
        setIsAppOwner(isOwner);

        // Check if current user is the application delegate
        const isDelegate =
          data.app_delegate &&
          currentUserRef
            .toLowerCase()
            .includes(data.app_delegate.toLowerCase());
        setIsAppDelegate(isDelegate);

        setOwnerChecked(true);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error checking app owner or delegate:', error);
        setOwnerChecked(true);
      }
    };

    if (app_name && frequency && period) {
      fetchAuditStatus();
      checkAppOwnerOrDelegate();
    }

    // Add event listener to refetch status when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden && app_name && frequency && period) {
        fetchAuditStatus();
      }
    };

    // Add event listener to refetch status when window gains focus
    const handleFocus = () => {
      if (app_name && frequency && period) {
        fetchAuditStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app_name, frequency, period, discoveryApi, fetchApi, identityApi]);

  const checkAllApprovalsComplete = async (): Promise<{
    canProceed: boolean;
    totalPending: number;
    userCounts: any;
    serviceCounts: any;
  }> => {
    try {
      const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');

      // Fetch user access reviews
      const userRes = await fetchApi.fetch(
        `${baseUrl}/access-reviews?app_name=${encodeURIComponent(
          app_name || '',
        )}&frequency=${encodeURIComponent(
          frequency || '',
        )}&period=${encodeURIComponent(period || '')}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        },
      );
      const userData = await userRes.json();
      const userApproved = userData.filter(
        (d: any) => d.sign_off_status === 'approved',
      ).length;
      const userRejected = userData.filter(
        (d: any) => d.sign_off_status === 'rejected',
      ).length;
      const userCompleted = userApproved + userRejected;
      const userTotal = userData.length;
      const userPending = userTotal - userCompleted;
      const userCountsFresh = {
        completed: userCompleted,
        total: userTotal,
        pending: userPending,
        approved: userApproved,
        rejected: userRejected,
      };

      // Fetch service account reviews
      const serviceRes = await fetchApi.fetch(
        `${baseUrl}/service_account_access_review?app_name=${encodeURIComponent(
          app_name || '',
        )}&frequency=${encodeURIComponent(
          frequency || '',
        )}&period=${encodeURIComponent(period || '')}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        },
      );
      const serviceData = await serviceRes.json();
      const serviceApproved = serviceData.filter(
        (d: any) => d.sign_off_status === 'approved',
      ).length;
      const serviceRejected = serviceData.filter(
        (d: any) => d.sign_off_status === 'rejected',
      ).length;
      const serviceCompleted = serviceApproved + serviceRejected;
      const serviceTotal = serviceData.length;
      const servicePending = serviceTotal - serviceCompleted;
      const serviceCountsFresh = {
        completed: serviceCompleted,
        total: serviceTotal,
        pending: servicePending,
        approved: serviceApproved,
        rejected: serviceRejected,
      };

      const totalPending = userPending + servicePending;
      return {
        canProceed: totalPending === 0,
        totalPending,
        userCounts: userCountsFresh,
        serviceCounts: serviceCountsFresh,
      };
    } catch (error) {
      throw new Error('Failed to fetch review counts');
    }
  };

  const handleFinalSignOff = async () => {
    try {
      const approvalCheck = await checkAllApprovalsComplete();

      if (!approvalCheck.canProceed) {
        alertApi.post({
          message: `Cannot proceed with final sign-off. ${approvalCheck.totalPending} review(s) still pending. Please complete all reviews first.`,
          severity: 'warning',
        });
        return;
      }

      // Update the counts state
      setUserCounts(approvalCheck.userCounts);
      setServiceCounts(approvalCheck.serviceCounts);

      setSignOffDialogOpen(true);
    } catch (error) {
      alertApi.post({
        message:
          'Unable to verify review status. Please refresh the page and try again.',
        severity: 'error',
      });
    }
  };

  const confirmFinalSignOff = async () => {
    try {
      const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
      const identity = await identityApi.getBackstageIdentity();
      const user = identity.userEntityRef;
      const response = await fetchApi.fetch(`${baseUrl}/audits/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          app_name,
          frequency,
          period,
          progress: 'final_sign_off_done',
          performed_by: user,
        }),
      });

      if (response.ok) {
        setIsFinalSignedOff(true);
        alertApi.post({
          message:
            'Final sign-off completed successfully! Audit is now in read-only mode.',
          severity: 'success',
        });
        setSignOffDialogOpen(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to perform final sign-off');
      }
    } catch (error) {
      alertApi.post({
        message:
          error instanceof Error
            ? error.message
            : 'Failed to perform final sign-off. Please try again.',
        severity: 'error',
      });
      // eslint-disable-next-line no-console
      console.error('Error performing final sign-off:', error);
    }
  };

  const handleSendEmailReminder = async () => {
    try {
      // Check if all approvals are done using the reusable function
      const approvalCheck = await checkAllApprovalsComplete();

      if (!approvalCheck.canProceed) {
        alertApi.post({
          message: `Cannot send email reminder. ${approvalCheck.totalPending} review(s) still pending. Please complete all reviews first.`,
          severity: 'warning',
        });
        return;
      }

      // If all approvals are done, proceed with sending email
      const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
      const response = await fetchApi.fetch(`${baseUrl}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: appOwnerEmail,
          subject: `Final Sign-Off Required: ${frequency?.toUpperCase()} Audit (${period}) for Application: ${app_name}`,
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="UTF-8">
                <title>Red Hat Mail</title>
              </head>
              <body style="margin:0; padding:0; font-family:Arial, sans-serif; background-color:#ffffff;">
                <!-- Header with background image and button -->
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#000000;">
                  <tr>
                    <td align="center">
                      <table width="100%" cellpadding="0" cellspacing="0" border="0"
                        style="background-image: url('https://ci3.googleusercontent.com/meips/ADKq_NZxYt6HwBrhpEd1DXOcWtdVGJV5kcLH2pXVUfiZtMOals1vK1j1VW4rr9a28rMKuHiCAQYSRnNEMaZwtGUP-91zyb7nXCVQcrVodPHewe6Lo1S0M1aO2k9DxayVBkdE7OukG6ffhmmxTkX86R7HrwHVtlM-fEDObpIlBpPVsrNAuo6gnSsDkqbn9sJRd4bRUl9PrQxW0AT6c7rqu-xVKjRjidwUQbWf6AON2U_nIHiRRifXbUlTq4eNaCmqxZH-iD9gmiq6OKK_Uw=s0-d-e1-ft#https://wd5.myworkdaycdn.com/wday/image/redhat/292d280c-71cc-4f8c-b763-e3e546a6bcff?__token__=exp=1845366800~hmac=5676B44AEE7D641429F58BF8BC241D2C48ADDD4F246C1C1CF99F5A63DE51E758'); background-size: contain; background-position: center; height: 120px; text-align: center; background-repeat: no-repeat;">
                        <tr>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Body content -->
                <table width="100%" cellspacing="0" border="0">
                  <tr>
                    <td align="center">
                      <table width="600" cellspacing="0" border="0">
                        <tr>
                          <td style="font-size: 16px;  font-family: Red Hat Display">
                            <p>Hi Application Owner,</p>
                            <p>
                              The <strong>${frequency} ${period}</strong> access review audit for application 
                              <strong>${app_name}</strong> has been completed with all user and service account reviews finalized.
                            </p>
                            <p>
                              As the application owner, you are now required to perform the final sign-off to complete this audit process.
                            </p>
                            <p>Please click the button below to access the audit system and complete your final sign-off:</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="vertical-align: middle; text-align: center; font-family: Red Hat Display; padding-top: 10px;">
                            <a href="${window.location.origin}/audit-access-manager/${app_name}/${frequency}/${period}/details"
                              style="background-color: #CC0000; color: #FFFFFF; padding: 12px 24px; text-decoration: none; font-family: Red Hat Display; border-radius: 5px; display: inline-block;"
                              target="_blank" rel="noopener noreferrer">
                              Complete Final Sign-off
                            </a>
                          </td>
                        </tr>
                        <tr>
                          <td style="font-size: 16px;  font-family: Red Hat Display; padding-top: 20px;">
                            <p>Best regards,</p>
                            <p>Audit Compliance System</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Footer -->
                <table width="100%" cellpadding="20" cellspacing="0" border="0" style="background-color:#f4f4f4; margin-top:10px;">
                  <tr>
                    <td align="center">
                      <table width="600" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="text-align:center; font-size: 12px;">
                            © 2025 Red Hat, Inc. All rights reserved. <br />
                            This is an automated message. Please do not reply.
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
            </html>
          `,
        }),
      });

      if (response.ok) {
        alertApi.post({
          message: 'Email reminder sent successfully to the application owner',
          severity: 'success',
        });
        setEmailReminderDialogOpen(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email reminder');
      }
    } catch (error) {
      alertApi.post({
        message:
          error instanceof Error
            ? error.message
            : 'Failed to send email reminder. Please try again.',
        severity: 'error',
      });
      // eslint-disable-next-line no-console
      console.error('Error sending email reminder:', error);
    }
  };

  const handleSummary = async () => {
    if (isAuditCompleted) {
      // If already completed, just navigate to summary page
      navigate(
        `/audit-access-manager/${app_name}/${frequency}/${period}/summary`,
      );
      return;
    }
    try {
      const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');

      // Update the progress
      const progressResponse = await fetchApi.fetch(
        `${baseUrl}/audits/progress`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            app_name,
            frequency,
            period,
            progress: 'summary_generated',
          }),
        },
      );

      if (!progressResponse.ok) {
        const errorData = await progressResponse.json();
        throw new Error(errorData.error || 'Failed to update audit progress');
      }

      // Create the activity event with user information
      const eventResponse = await fetchApi.fetch(`${baseUrl}/activity-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_type: 'AUDIT_SUMMARY_GENERATED',
          app_name,
          frequency,
          period,
          performed_by: currentUser,
        }),
      });

      if (!eventResponse.ok) {
        throw new Error('Failed to create activity event');
      }

      // Navigate to summary page
      navigate(
        `/audit-access-manager/${app_name}/${frequency}/${period}/summary`,
      );
    } catch (error) {
      alertApi.post({
        message:
          error instanceof Error ? error.message : 'Failed to generate summary',
        severity: 'error',
      });
      // eslint-disable-next-line no-console
      console.error('Error generating summary:', error);
    }
  };

  if (!app_name || !frequency || !period) {
    return (
      <Typography color="error">
        Missing required parameters: app_name, frequency, or period
      </Typography>
    );
  }

  const handleBack = () => navigate(-1);

  const tables = [
    <RoverAuditTable
      key="user"
      app_name={app_name}
      frequency={frequency}
      period={period}
      setCounts={setUserCounts}
      isFinalSignedOff={isFinalSignedOff}
      isAuditCompleted={isAuditCompleted}
    />,
    <ServiceAccountAccessReviewTable
      key="service"
      app_name={app_name}
      frequency={frequency}
      period={period}
      setCounts={setServiceCounts}
      isFinalSignedOff={isFinalSignedOff}
      isAuditCompleted={isAuditCompleted}
    />,
    <AuditActivityStream
      key="activity"
      app_name={app_name}
      frequency={frequency}
      period={period}
    />,
  ];

  const getTooltipTitle = () => {
    if (isAuditCompleted) {
      return 'Audit is completed and cannot be modified';
    }
    if (isFinalSignedOff) {
      return 'Audit has been finally signed off';
    }
    if (!isAppOwner && !isAppDelegate) {
      return `Only application owner can perform the final sign off`;
    }
    if (isAppDelegate && !isAppOwner) {
      return 'Send email reminder to application owner for final sign-off';
    }
    return 'Perform final sign-off';
  };

  const getSummaryTooltip = () => {
    if (userCounts.pending > 0 || serviceCounts.pending > 0) {
      return 'Complete all user and service account reviews to view the final summary.';
    }
    if (!isFinalSignedOff) {
      return 'Summary is genetrated but in read only mode';
    }
    return 'View Final Summary';
  };

  // Add debug log for button state
  const isButtonReady = statusChecked && ownerChecked;
  const isFinalSignOffButtonDisabled =
    !isButtonReady || !isAppOwner || isFinalSignedOff || isAuditCompleted;

  const isEmailReminderButtonDisabled =
    !isButtonReady ||
    !isAppDelegate ||
    isAppOwner ||
    isFinalSignedOff ||
    isAuditCompleted ||
    userCounts.pending > 0 ||
    serviceCounts.pending > 0;

  return (
    <Page themeId="tool">
      <Header
        title="Audit Access Manager"
        subtitle={
          <Box>
            <Typography variant="subtitle1" style={{ marginBottom: '8px' }}>
              Ensure Trust. Enforce Standards. Empower Teams.
            </Typography>
            <Breadcrumbs aria-label="breadcrumb">
              <Link to="/audit-access-manager">Audit Access Manager</Link>
              <Link to={`/audit-access-manager/${app_name}`}>
                Audit Initiation
              </Link>
              <Typography color="textPrimary">Audit Details</Typography>
            </Breadcrumbs>
          </Box>
        }
      >
        <HeaderLabel
          label="Owner"
          value={
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <GroupIcon fontSize="small" /> Appdev
            </span>
          }
        />
        <HeaderLabel label="Lifecycle" value="Alpha" />
        <Tooltip title="Configuration">
          <IconButton color="primary" />
        </Tooltip>
      </Header>

      <Content>
        {isAuditCompleted && (
          <Box mb={2}>
            <Alert severity="info">
              This audit has been completed and is now in read-only mode.
            </Alert>
          </Box>
        )}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h4">
            {`${app_name} Quarterly Audit – ${period.toUpperCase()} Review`}
          </Typography>
          <Box display="flex" alignItems="center">
            {/* Show Final Sign Off button only for application owners */}
            {isAppOwner && (
              <Tooltip title={getTooltipTitle()}>
                <span>
                  <Button
                    variant="contained"
                    className={classes.finalSignOffButton}
                    onClick={handleFinalSignOff}
                    disabled={isFinalSignOffButtonDisabled}
                  >
                    Final Sign Off
                    {isFinalSignedOff && ' (Completed)'}
                  </Button>
                </span>
              </Tooltip>
            )}

            {/* Show Email Reminder button for application delegates when all approvals are done */}
            {isAppDelegate && !isAppOwner && (
              <Tooltip title={getTooltipTitle()}>
                <span>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => setEmailReminderDialogOpen(true)}
                    disabled={isEmailReminderButtonDisabled}
                  >
                    Send Email Reminder
                  </Button>
                </span>
              </Tooltip>
            )}
            <Tooltip title={getSummaryTooltip()}>
              <span>
                <Button
                  variant="contained"
                  className={classes.summaryButton}
                  onClick={handleSummary}
                  startIcon={<AssessmentIcon />}
                  disabled={
                    userCounts.pending > 0 ||
                    serviceCounts.pending > 0 ||
                    (!isFinalSignedOff && !isAuditCompleted)
                  }
                >
                  View Final Summary
                </Button>
              </span>
            </Tooltip>
            <Tooltip title="Back to Audit List">
              <IconButton onClick={handleBack}>
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Tabs
          value={tabIndex}
          onChange={(_, index) => setTabIndex(index)}
          indicatorColor="primary"
          textColor="primary"
          className={classes.tabsRoot}
        >
          <Tab
            label={
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <PersonIcon style={{ marginRight: 8 }} />
                {`User Access Review (${userCounts.completed}/${userCounts.total})`}
              </span>
            }
          />
          <Tab
            label={
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <VpnKeyIcon style={{ marginRight: 8 }} />
                {`Service Account Review (${serviceCounts.completed}/${serviceCounts.total})`}
              </span>
            }
          />
          <Tab
            label={
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TimelineIcon style={{ marginRight: 8 }} />
                Activity Stream
              </span>
            }
          />
        </Tabs>

        <Box className={classes.tabPanel}>{tables[tabIndex]}</Box>

        <Dialog
          open={signOffDialogOpen}
          onClose={() => setSignOffDialogOpen(false)}
        >
          <DialogTitle>Confirm Final Sign-off</DialogTitle>
          <DialogContent className={classes.dialogContent}>
            <Box className={classes.summarySection}>
              <Typography variant="h6" className={classes.summaryTitle}>
                User Access Reviews
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box className={classes.chipContainer}>
                    <Chip
                      label={`Approved: ${userCounts.approved}`}
                      variant="outlined"
                      className={classes.approvedChip}
                    />
                    <Chip
                      label={`Rejected: ${userCounts.rejected}`}
                      variant="outlined"
                      className={classes.rejectedChip}
                    />
                    <Chip
                      label={`Pending: ${userCounts.pending}`}
                      variant="outlined"
                      className={classes.pendingChip}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Box>

            <Box className={classes.summarySection}>
              <Typography variant="h6" className={classes.summaryTitle}>
                Service Account Reviews
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box className={classes.chipContainer}>
                    <Chip
                      label={`Approved: ${serviceCounts.approved}`}
                      variant="outlined"
                      className={classes.approvedChip}
                    />
                    <Chip
                      label={`Rejected: ${serviceCounts.rejected}`}
                      variant="outlined"
                      className={classes.rejectedChip}
                    />
                    <Chip
                      label={`Pending: ${serviceCounts.pending}`}
                      variant="outlined"
                      className={classes.pendingChip}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSignOffDialogOpen(false)} color="primary">
              Cancel
            </Button>
            <Button
              onClick={confirmFinalSignOff}
              color="primary"
              variant="contained"
            >
              Confirm Sign-off
            </Button>
          </DialogActions>
        </Dialog>

        {/* Email Reminder Dialog */}
        <Dialog
          open={emailReminderDialogOpen}
          onClose={() => setEmailReminderDialogOpen(false)}
        >
          <DialogTitle>Send Email Reminder</DialogTitle>
          <DialogContent className={classes.dialogContent}>
            <Typography variant="body1" style={{ marginBottom: 16 }}>
              This will send an email reminder to the application owner
              requesting them to complete the final sign-off for this audit.
            </Typography>
            <Typography variant="body2" color="textSecondary">
              The email will be sent to: {appOwnerEmail}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setEmailReminderDialogOpen(false)}
              color="primary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendEmailReminder}
              color="primary"
              variant="contained"
            >
              Send Email Reminder
            </Button>
          </DialogActions>
        </Dialog>
      </Content>
    </Page>
  );
};
