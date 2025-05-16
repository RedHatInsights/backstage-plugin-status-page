import {
  Content,
  Header,
  HeaderLabel,
  Page,
  Table,
} from '@backstage/core-components';
import {
  alertApiRef,
  discoveryApiRef,
  fetchApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import {
  ExportCsv as exportCsv,
  ExportPdf as exportPdf,
} from '@material-table/exporters';
import {
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Tooltip,
  Typography,
} from '@material-ui/core';
import Paper from '@material-ui/core/Paper';
import { capitalize } from 'lodash';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useStyles } from './AuditSummary.styles';
import { UserAuditEntry, ServiceAccountAuditEntry } from './types';

export const AuditSummary: React.FC = () => {
  const { app_name, frequency, period } = useParams<{
    app_name: string;
    frequency: string;
    period: string;
  }>();
  const alertApi = useApi(alertApiRef);
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
  const [entries, setEntries] = useState<UserAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceData, setServiceData] = useState<ServiceAccountAuditEntry[]>(
    [],
  );
  const [appMetadata, setAppMetadata] = useState<{
    app_owner?: string;
    app_delegate?: string;
  }>({});

  const classes = useStyles();

  useEffect(() => {
    const fetchAuditData = async () => {
      if (!app_name) return; // Early return if undefined
      try {
        const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');

        const [userRes, serviceRes, appMetaRes] = await Promise.all([
          fetchApi
            .fetch(
              `${baseUrl}/access-reviews?app_name=${app_name}&frequency=${frequency}&period=${period}`,
              {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
              },
            )
            .then(res => res.json()),

          fetchApi
            .fetch(
              `${baseUrl}/service_account_access_review?app_name=${app_name}&frequency=${frequency}&period=${period}`,
              {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
              },
            )
            .then(res => res.json()),

          fetchApi
            .fetch(`${baseUrl}/applications`, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            })
            .then(res => res.json()),
        ]);

        setEntries(userRes || []);
        setServiceData(serviceRes || []);

        const matchedApp = Array.isArray(appMetaRes)
          ? appMetaRes.find(
              (app: any) =>
                app.app_name.toLowerCase() === app_name.toLowerCase(),
            )
          : {};
        setAppMetadata(matchedApp || {});
      } catch (err) {
        alertApi.post({
          message: 'Failed to load audit data',
          severity: 'error',
        });
        // eslint-disable-next-line no-console
        console.error(err);
        setError('Failed to load audit data');
      } finally {
        setLoading(false);
      }
    };

    fetchAuditData();
  }, [app_name, frequency, period, alertApi, discoveryApi, fetchApi]);

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!entries.length) return <Typography>No audit data available.</Typography>;

  const approvedUserEntries = entries.filter(
    e => e.sign_off_status === 'approved',
  );
  const rejectedUserEntries = entries.filter(
    e => e.sign_off_status === 'rejected',
  );
  const pendingUserEntries = entries.filter(
    e => e.sign_off_status === 'pending',
  );

  const approvedServiceEntries = serviceData.filter(
    e => e.signed_off === 'approved',
  );
  const rejectedServiceEntries = serviceData.filter(
    e => e.signed_off === 'rejected',
  );
  const pendingServiceEntries = serviceData.filter(
    e => e.signed_off === 'pending',
  );

  const totalReviewed = entries.length + serviceData.length;
  const users = entries;
  const serviceAccounts = serviceData;

  const dualAccess = entries.filter(e => e.source === 'Both');
  const openTickets = [...entries, ...serviceData].filter(
    e => e.ticket_status && e.ticket_status.toLowerCase() !== 'closed',
  );

  const columns = [
    { title: 'ID', field: 'id', hidden: true },
    { title: 'App Name', field: 'app_name' },
    { title: 'User ID', field: 'user_id' },
    { title: 'Full Name', field: 'full_name' },
    { title: 'Environment', field: 'environment' },
    { title: 'Role', field: 'user_role' },
    { title: 'Manager', field: 'manager' },
    {
      title: 'Sign-off Status',
      field: 'sign_off_status',
      render: (row: Partial<UserAuditEntry>) => {
        const status = row.sign_off_status?.toLowerCase();
        let chipClass = classes.chipDefault;
        if (status === 'approved') chipClass = classes.chipApproved;
        else if (status === 'rejected') chipClass = classes.chipRejected;
        return (
          <Chip
            label={row.sign_off_status ? capitalize(status) : 'N/A'}
            className={chipClass}
            size="small"
          />
        );
      },
    },
    { title: 'Signed Off By', field: 'sign_off_by' },
    { title: 'Sign-off Date', field: 'sign_off_date' },
    { title: 'Source', field: 'source' },
    { title: 'Comments', field: 'comments' },
    { title: 'Ticket Ref.', field: 'ticket_reference' },
    { title: 'Ticket Status', field: 'ticket_status' },
    { title: 'Access Change Date', field: 'access_change_date' },
    { title: 'Created At', field: 'created_at' },
    { title: 'Rover Group', field: 'rover_group_name' },
    { title: 'App Delegate', field: 'app_delegate' },
  ];

  return (
    <Page themeId="tool">
      <Header
        title="Audit and Compliance"
        subtitle="Ensure Trust. Enforce Standards. Empower Teams."
      >
        <HeaderLabel label="Owner" value="Team X" />
        <HeaderLabel label="Lifecycle" value="Alpha" />
        <Tooltip title="Configuration">
          <IconButton color="primary" />
        </Tooltip>
      </Header>

      <Content>
        <div id="audit-report" style={{ margin: 16 }}>
          <Typography
            variant="h1"
            align="center"
            gutterBottom
            style={{ fontWeight: 'bold', color: '#1565c0' }}
          >
            Audit Report for Hydra
          </Typography>
          <Typography variant="h4" gutterBottom>
            Audit Metadata
          </Typography>
          <Divider style={{ marginBottom: 16 }} />
          <Grid container spacing={2} style={{ marginBottom: 32 }}>
            <Grid item xs={6}>
              <Typography>
                <strong>Application Name:</strong> {app_name}
              </Typography>
              <Typography>
                <strong>Audit Frequency:</strong> {frequency}
              </Typography>
              <Typography>
                <strong>Audit Period:</strong> {period}
              </Typography>
              <Typography>
                <strong>Initiated By:</strong> {appMetadata?.app_owner || 'N/A'}
              </Typography>
              <Typography>
                <strong>App Delegate:</strong>{' '}
                {appMetadata?.app_delegate || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography>
                <strong>Initiated On:</strong> 2025-04-01
              </Typography>
              <Typography>
                <strong>Sign-off Authority:</strong>{' '}
                {appMetadata.app_delegate || 'N/A'}
              </Typography>
              <Typography>
                <strong>Status:</strong> In Progress
              </Typography>
              <Typography>
                <strong>Completed On:</strong>
              </Typography>
            </Grid>
          </Grid>

          {/* Summary Statistics */}
          <Typography variant="h4" gutterBottom>
            Summary Statistics
          </Typography>
          <Divider style={{ marginBottom: 16 }} />
          <Grid container spacing={3} style={{ marginBottom: 32 }}>
            {[
              { label: 'Total Reviewed', value: totalReviewed },
              { label: 'Users', value: users.length },
              { label: 'Service Accounts', value: serviceAccounts.length },
              { label: 'Dual Access', value: dualAccess.length },
              {
                label: 'Approved',
                value:
                  approvedUserEntries.length + approvedServiceEntries.length,
                className: classes.greenText,
              },
              {
                label: 'Rejected',
                value:
                  rejectedUserEntries.length + rejectedServiceEntries.length,
                className: classes.redText,
              },
              {
                label: 'Pending',
                value: pendingUserEntries.length + pendingServiceEntries.length,
              },
              {
                label: 'Open Tickets',
                value: openTickets.length,
              },
            ].map((stat, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Paper className={classes.statCard}>
                  <Typography
                    className={`${classes.statLabel} ${classes.blueTitle}`}
                  >
                    {stat.label}
                  </Typography>
                  <Typography
                    className={`${classes.statValue} ${stat.className || ''}`}
                  >
                    {stat.value}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Rejected */}
          {rejectedUserEntries.length > 0 && (
            <>
              <Typography variant="h4" gutterBottom>
                Rejected Rover Reviews & Justifications
              </Typography>
              <Divider style={{ marginBottom: 16 }} />
              <Table
                title="Rejected Rover Reviews with Comments"
                columns={columns}
                data={rejectedUserEntries}
                options={{
                  paging: true,
                  pageSize: 5,
                  exportAllData: true,
                  exportMenu: [
                    {
                      label: 'Export to PDF',
                      exportFunc: (cols, renderData) =>
                        exportPdf(
                          cols,
                          renderData,
                          `pdf_${new Date().getTime()}`,
                        ),
                    },
                    {
                      label: 'Export to CSV',
                      exportFunc: (col, rData) => {
                        exportCsv(col, rData, `csv_${new Date().getTime()}`);
                      },
                    },
                  ],
                }}
              />
            </>
          )}

          {/* Approved */}
          {approvedUserEntries.length > 0 && (
            <>
              <Typography variant="h4" style={{ marginTop: 32 }} gutterBottom>
                Approved Rover Reviews
              </Typography>
              <Divider style={{ marginBottom: 16 }} />
              <Table
                title="Approved Rover Reviews"
                columns={columns}
                data={approvedUserEntries}
                options={{
                  paging: true,
                  pageSize: 5,
                  exportAllData: true,
                  exportMenu: [
                    {
                      label: 'Export to PDF',
                      exportFunc: (cols, renderData) =>
                        exportPdf(
                          cols,
                          renderData,
                          `pdf_${new Date().getTime()}`,
                        ),
                    },
                    {
                      label: 'Export to CSV',
                      exportFunc: (col, rData) => {
                        exportCsv(col, rData, `csv_${new Date().getTime()}`);
                      },
                    },
                  ],
                }}
              />
            </>
          )}

          {/* Pending */}
          {pendingUserEntries.length > 0 && (
            <>
              <Typography variant="h4" gutterBottom>
                Pending reviews
              </Typography>
              <Divider style={{ marginBottom: 16 }} />
              <Table
                title="Pending reviews"
                columns={columns}
                data={pendingUserEntries}
                options={{
                  paging: true,
                  pageSize: 5,
                  exportAllData: true,
                  exportMenu: [
                    {
                      label: 'Export to PDF',
                      exportFunc: (cols, renderData) =>
                        exportPdf(
                          cols,
                          renderData,
                          `pdf_${new Date().getTime()}`,
                        ),
                    },
                    {
                      label: 'Export to CSV',
                      exportFunc: (col, rData) =>
                        exportCsv(col, rData, `csv_${new Date().getTime()}`),
                    },
                  ],
                }}
              />
            </>
          )}

          {/* Service Accounts */}
          {serviceData.length > 0 && (
            <>
              <Typography variant="h4" style={{ marginTop: 32 }} gutterBottom>
                Service Account Review
              </Typography>
              <Divider style={{ marginBottom: 16 }} />
              <Table
                title="Service Account Review"
                columns={[
                  { title: 'Service Account', field: 'service_account' },
                  { title: 'Application', field: 'app_name' },
                  { title: 'Environment', field: 'environment' },
                  { title: 'Role', field: 'user_role' },
                  { title: 'Manager', field: 'manager' },
                  { title: 'Ticket Ref.', field: 'ticket_reference' },
                  { title: 'Ticket Status', field: 'ticket_status' },
                  { title: 'Custom Reviwer', field: 'app_delegate' },
                  {
                    title: 'Signed Off',
                    field: 'signed_off',
                    render: (row: any) => {
                      const status = row.signed_off?.toLowerCase();
                      let chipClass = classes.chipDefault;
                      if (status === 'approved')
                        chipClass = classes.chipApproved;
                      else if (status === 'rejected')
                        chipClass = classes.chipRejected;
                      return (
                        <Chip
                          label={capitalize(status)}
                          className={chipClass}
                          size="small"
                        />
                      );
                    },
                  },
                  { title: 'Signed Off By', field: 'signed_off_by' },
                  {
                    title: 'Sign-off Date',
                    field: 'sign_off_date',
                    render: rowData =>
                      rowData.sign_off_date
                        ? new Date(rowData.sign_off_date).toLocaleDateString()
                        : 'N/A',
                  },
                  { title: 'Comments', field: 'comments' },
                ]}
                data={serviceData}
                options={{
                  paging: true,
                  pageSize: 3,
                  exportAllData: true,
                  exportMenu: [
                    {
                      label: 'Export to PDF',
                      exportFunc: (cols, renderData) =>
                        exportPdf(
                          cols,
                          renderData,
                          `pdf_${new Date().getTime()}`,
                        ),
                    },
                    {
                      label: 'Export to CSV',
                      exportFunc: (col, rData) =>
                        exportCsv(col, rData, `csv_${new Date().getTime()}`),
                    },
                  ],
                }}
              />
            </>
          )}
        </div>
      </Content>
    </Page>
  );
};

export default AuditSummary;
