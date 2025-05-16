import {
  Table as BackstageTable,
  Content,
  Page,
  TableColumn,
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
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
  Grid,
  Switch,
  TextField,
  Typography,
} from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import EmailModal from '../../Modals/EmailModal';
import JiraModal from '../../Modals/JiraModal';
import { ServiceAccountData } from './types';
import { identityApiRef } from '@backstage/core-plugin-api';

export default function ServiceAccountAccessReviewTable({
  frequency,
  period,
  app_name,
}: any) {
  const [data, setData] = useState<ServiceAccountData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<ServiceAccountData[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sendEmailModalOpen, setSendEmailModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ServiceAccountData | null>(
    null,
  );
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
  const alertApi = useApi(alertApiRef);
  const identityApi = useApi(identityApiRef);
  const [currentUser, setCurrentUser] = useState<string>('');
  const getCurrentUser = async () => {
    try {
      const identity = await identityApi.getBackstageIdentity();

      const user = identity.userEntityRef;
      setCurrentUser(user);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching current user:', error);
    }
  };

  useEffect(() => {
    getCurrentUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEmailSendSuccess = () => {
    alertApi.post({ message: 'Email sent successfully!', severity: 'success' });
    setSendEmailModalOpen(false);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
      const queryParams = new URLSearchParams({
        app_name: app_name,
        frequency: frequency,
        period: period,
      });

      const response = await fetchApi.fetch(
        `${baseUrl}/service_account_access_review?${queryParams.toString()}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      const result = await response.json();
      setData(result || []);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error fetching data', err);
      alertApi.post({ message: 'Failed to fetch data.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app_name, frequency, period]);

  const postUpdate = async (user: ServiceAccountData) => {
    try {
      const { tableData, ...cleanUser } = user;
      const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
      await fetchApi.fetch(`${baseUrl}/service_account_access_review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanUser),
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to post update:', err);
      alertApi.post({
        message: 'Failed to update user data.',
        severity: 'error',
      });
    }
  };

  const handleApprove = async (user: ServiceAccountData) => {
    const updatedUser = {
      ...user,
      signed_off: 'approved',
      signed_off_by: currentUser,
      sign_off_date: new Date().toISOString(),
    };

    // Just update this one user
    setData(prev => prev.map(d => (d.id === user.id ? updatedUser : d)));
    await postUpdate(updatedUser); // Should be ONE call
  };

  const handleReject = (user: ServiceAccountData) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const handleTicketSubmit = async (ticketType: string, comments: string) => {
    if (!selectedUser) return;

    const ticketNumber = `${ticketType.toUpperCase()}-${Math.floor(
      Math.random() * 10000,
    )}`;

    const updatedUser = {
      ...selectedUser,
      signed_off: 'rejected',
      signed_off_by: currentUser,
      sign_off_date: new Date().toISOString(),
      ticket_reference: ticketNumber,
      comments: comments,
    };

    await postUpdate(updatedUser);

    const updatedData = data.map(d =>
      d.id === updatedUser.id ? updatedUser : d,
    );

    setData(updatedData);
    setDialogOpen(false);
    setSelectedUser(null);
  };

  const handleBulkApprove = async () => {
    const approvedUsers = selectedRows.map(user => ({
      ...user,
      signed_off: 'approved',
      signed_off_by: currentUser,
      sign_off_date: new Date().toISOString(),
    }));

    try {
      const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
      await fetchApi.fetch(`${baseUrl}/service_account_access_review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(approvedUsers), // ⬅️ Bulk array POST
      });

      const updatedData = data.map(
        d => approvedUsers.find(u => u.id === d.id) || d,
      );

      setData(updatedData);
      setSelectedRows([]);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to bulk approve:', err);
      alertApi.post({
        message: 'Failed to approve selected users.',
        severity: 'error',
      });
    }
  };

  const handleBulkRejectSubmit = async (
    ticketType: string,
    comments: string,
  ) => {
    const ticketNumber = `${ticketType.toUpperCase()}-${Math.floor(
      Math.random() * 10000,
    )}`;

    const updatedUsers = selectedRows.map(user => ({
      ...user,
      signed_off: 'rejected',
      signed_off_by: currentUser,
      sign_off_date: new Date().toISOString(),
      jira_ticket_reference: ticketNumber,
      comments: comments,
    }));

    try {
      const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
      await fetchApi.fetch(`${baseUrl}/service_account_access_review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedUsers), // ⬅️ Bulk payload here
      });

      const updatedData = data.map(
        d => updatedUsers.find(u => u.id === d.id) || d,
      );

      setData(updatedData);
      setSelectedRows([]);
      setDialogOpen(false);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to bulk reject:', err);
      alertApi.post({
        message: 'Failed to reject selected users.',
        severity: 'error',
      });
    }
  };

  const columns: TableColumn<ServiceAccountData>[] = [
    { title: 'User ID', field: 'service_account' },
    { title: 'Application', field: 'app_name' },
    { title: 'Environment', field: 'environment' },
    { title: 'Role', field: 'user_role' },
    { title: 'Manager', field: 'manager' },
    { title: 'Custom Reviewer', field: 'app_delegate' },
    {
      title: 'Status',
      field: 'signed_off',
      render: row => {
        let color = '#ccc';
        if (row.signed_off === 'approved') color = '#d1f1bb';
        else if (row.signed_off === 'rejected') color = '#fbc5c5';
        return (
          <Chip label={row.signed_off} style={{ backgroundColor: color }} />
        );
      },
    },
    { title: 'Approved By', field: 'signed_off_by', hidden: !showDetails },
    { title: 'Sign-off Date', field: 'sign_off_date', hidden: !showDetails },
    {
      title: 'Ticket ID',
      field: 'ticket_reference',
      hidden: !showDetails,
    },
    {
      title: 'Ticket Status',
      field: 'ticket_status',
      hidden: !showDetails,
    },
    {
      title: 'Comments',
      field: 'comments',
      hidden: !showDetails,
      render: row => (
        <TextField
          value={row.comments || ''}
          onChange={e => {
            const updated = data.map(d =>
              d.id === row.id ? { ...d, comments: e.target.value } : d,
            );
            setData(updated);
          }}
          multiline
          size="small"
        />
      ),
    },
    {
      title: 'Access Revoked',
      field: 'date_of_access_revoked',
      hidden: !showDetails,
    },
    { title: 'Created At', field: 'created_at', hidden: !showDetails },
    { title: 'Updated At', field: 'updated_at', hidden: !showDetails },
    {
      title: 'Actions',
      render: row => (
        <Box display="flex">
          <Button
            variant="contained"
            color="primary"
            size="small"
            style={{ margin: '0 10px' }}
            onClick={() => handleApprove(row)}
          >
            Approve
          </Button>
          <Button
            variant="contained"
            color="secondary"
            size="small"
            onClick={() => handleReject(row)}
          >
            Reject
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Page themeId="tool">
      <Content>
        {loading ? (
          <CircularProgress />
        ) : (
          <>
            <Grid
              container
              spacing={2}
              alignItems="center"
              style={{ marginBottom: 16 }}
            >
              <Grid item>
                <Typography variant="h6">Bulk Actions:</Typography>
              </Grid>
              <Grid item>
                <Button
                  variant="outlined"
                  color="primary"
                  disabled={selectedRows.length === 0}
                  onClick={handleBulkApprove}
                >
                  Approve Selected
                </Button>
              </Grid>
              <Grid item>
                <Button
                  variant="outlined"
                  color="secondary"
                  disabled={selectedRows.length === 0}
                  onClick={() => {
                    setSelectedUser(selectedRows[0]);
                    setDialogOpen(true);
                  }}
                >
                  Reject Selected
                </Button>
              </Grid>
              <Grid item>
                <Button
                  variant="outlined"
                  color="primary"
                  disabled={selectedRows.length === 0}
                  onClick={() => setSendEmailModalOpen(true)}
                >
                  Send Email
                </Button>
              </Grid>
              <Grid item>
                <FormControlLabel
                  control={
                    <Switch
                      checked={showDetails}
                      onChange={e => setShowDetails(e.target.checked)}
                    />
                  }
                  label="Show Details"
                />
              </Grid>
            </Grid>
            <BackstageTable
              options={{
                paging: true,
                pageSize: 5,
                selection: true,
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
              onSelectionChange={rows => setSelectedRows(rows)}
              columns={columns}
              data={data}
            />
            <JiraModal
              open={dialogOpen}
              onClose={() => setDialogOpen(false)}
              onSubmit={
                selectedRows.length > 1
                  ? handleBulkRejectSubmit
                  : handleTicketSubmit
              }
            />
            <EmailModal
              open={sendEmailModalOpen}
              onClose={() => setSendEmailModalOpen(false)}
              selectedRows={selectedRows}
              currentUser={currentUser}
              onEmailSendSuccess={handleEmailSendSuccess}
            />
          </>
        )}
      </Content>
    </Page>
  );
}
