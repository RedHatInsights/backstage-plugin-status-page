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
import React, { useEffect, useState } from 'react';
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
  const [isAppOwnerOrDelegate, setIsAppOwnerOrDelegate] = useState(false);
  const [currentUser, setCurrentUser] = useState('');
  const [appOwners, setAppOwners] = useState<string[]>([]);
  const [appDelegates, setAppDelegates] = useState<string[]>([]);
  const [signOffDialogOpen, setSignOffDialogOpen] = useState(false);
  const [isAuditCompleted, setIsAuditCompleted] = useState(false);
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
  const alertApi = useApi(alertApiRef);
  const identityApi = useApi(identityApiRef);

  useEffect(() => {
    const fetchAuditStatus = async () => {
      try {
        const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
        const response = await fetchApi.fetch(
          `${baseUrl}/audits?app_name=${app_name}&frequency=${frequency}&period=${period}`,
        );
        const data = await response.json();
        if (data && data.length > 0) {
          const audit = data[0];
          setIsFinalSignedOff(audit.status === 'access_review_complete');
          setIsAuditCompleted(audit.progress === 'completed');
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching audit status:', error);
      }
    };

    const checkAppOwnerOrDelegate = async () => {
      try {
        const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
        const response = await fetchApi.fetch(
          `${baseUrl}/application-details/${app_name}`,
        );
        const data = await response.json();

        const owners = data.app_owner
          .split(',')
          .map((owner: string) => owner.trim());
        const delegates = data.app_delegate
          .split(',')
          .map((delegate: string) => delegate.trim());

        setAppOwners(owners);
        setAppDelegates(delegates);

        const identity = await identityApi.getBackstageIdentity();
        const user = identity.userEntityRef;
        setCurrentUser(user);

        setIsAppOwnerOrDelegate(
          owners.includes(user) || delegates.includes(user),
        );
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error checking app owner/delegate:', error);
      }
    };

    if (app_name && frequency && period) {
      fetchAuditStatus();
      checkAppOwnerOrDelegate();
    }
  }, [app_name, frequency, period, discoveryApi, fetchApi, identityApi]);

  const handleFinalSignOff = async () => {
    try {
      const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
      // Fetch user access reviews
      const userRes = await fetchApi.fetch(
        `${baseUrl}/access-reviews?app_name=${app_name}&frequency=${frequency}&period=${period}`,
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
      setUserCounts(userCountsFresh);

      // Fetch service account reviews
      const serviceRes = await fetchApi.fetch(
        `${baseUrl}/service_account_access_review?app_name=${app_name}&frequency=${frequency}&period=${period}`,
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
      setServiceCounts(serviceCountsFresh);

      const totalPending = userPending + servicePending;
      if (totalPending > 0) {
        alertApi.post({
          message: `Cannot perform final sign-off. There are ${totalPending} pending reviews.`,
          severity: 'error',
        });
        return;
      }
      setSignOffDialogOpen(true);
    } catch (error) {
      alertApi.post({
        message: 'Failed to fetch review counts. Please try again.',
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
          message: 'Final sign-off completed successfully',
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
            : 'Failed to perform final sign-off',
        severity: 'error',
      });
      // eslint-disable-next-line no-console
      console.error('Error performing final sign-off:', error);
    }
  };

  const handleSummary = async () => {
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
      navigate(`/audit-compliance/${app_name}/${frequency}/${period}/summary`);
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
    if (!isAppOwnerOrDelegate) {
      return `Only app owners (${appOwners.join(
        ', ',
      )}) or delegates (${appDelegates.join(', ')}) can perform final sign-off`;
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

  return (
    <Page themeId="tool">
      <Header
        title="Audit and Compliance"
        subtitle={
          <Box>
            <Typography variant="subtitle1" style={{ marginBottom: '8px' }}>
              Ensure Trust. Enforce Standards. Empower Teams.
            </Typography>
            <Breadcrumbs aria-label="breadcrumb">
              <Link to="/audit-compliance">Audit and Compliance</Link>
              <Link to={`/audit-compliance/${app_name}`}>Audit Initiation</Link>
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
            <Tooltip title={getTooltipTitle()}>
              <span>
                <Button
                  variant="contained"
                  className={classes.finalSignOffButton}
                  onClick={handleFinalSignOff}
                  disabled={
                    !isAppOwnerOrDelegate ||
                    isFinalSignedOff ||
                    isAuditCompleted
                  }
                >
                  Final Sign Off
                  {isFinalSignedOff && ' (Completed)'}
                </Button>
              </span>
            </Tooltip>
            <Tooltip title={getSummaryTooltip()}>
              <span>
                <Button
                  variant="contained"
                  className={classes.summaryButton}
                  onClick={handleSummary}
                  startIcon={<AssessmentIcon />}
                  disabled={userCounts.pending > 0 || serviceCounts.pending > 0}
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
      </Content>
    </Page>
  );
};
