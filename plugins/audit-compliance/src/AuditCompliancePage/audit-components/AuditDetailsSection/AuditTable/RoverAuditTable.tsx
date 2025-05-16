// Imports
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
  identityApiRef,
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
import { AuditTableProps, UserAccessData } from './types';

import { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';

export const postAuditUpdate = async (
  users: UserAccessData | UserAccessData[],
  discoveryApi: DiscoveryApi,
  fetchApi: FetchApi,
): Promise<void> => {
  try {
    const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
    const payload = Array.isArray(users) ? users : [users];

    await fetchApi.fetch(`${baseUrl}/access-reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to post audit update:', error);
    throw error;
  }
};

export default function RoverAuditTable({
  frequency,
  period,
  app_name,
}: AuditTableProps) {
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
  const alertApi = useApi(alertApiRef);
  const identityApi = useApi(identityApiRef);

  const [userData, setUserData] = useState<UserAccessData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<UserAccessData[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAccessData | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [sendEmailModalOpen, setSendEmailModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState('User');

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

  const fetchAuditData = async () => {
    try {
      setLoading(true);
      if (!app_name || !frequency || !period) {
        alertApi.post({
          message: 'Missing required parameters for the audit data.',
          severity: 'warning',
        });
        return;
      }

      const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
      const queryParams = new URLSearchParams({ app_name, frequency, period });

      const response = await fetchApi.fetch(
        `${baseUrl}/access-reviews?${queryParams.toString()}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        },
      );

      const data = await response.json();
      setUserData(data || []);
    } catch (error) {
      alertApi.post({
        message: 'Failed to load audit data.',
        severity: 'error',
      });
      // eslint-disable-next-line no-console
      console.error('Error fetching audit data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (frequency && period) {
      fetchAuditData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frequency, period, app_name]);

  const handleApprove = async (user: UserAccessData) => {
    const { tableData, ...cleanUser } = user as any;

    const updatedUser = {
      ...cleanUser,
      sign_off_status: 'approved',
      sign_off_by: currentUser,
      sign_off_date: new Date().toISOString(),
      access_change_date: new Date().toISOString(),
    };

    const updatedUserData = userData.map(d =>
      d.id === user.id ? updatedUser : d,
    );

    setUserData(updatedUserData);
    try {
      await postAuditUpdate(updatedUser, discoveryApi, fetchApi);
    } catch {
      alertApi.post({ message: 'Approval failed.', severity: 'error' });
    }
  };

  const handleReject = (user: UserAccessData) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const handleTicketSubmit = async (ticketType: string, comments: string) => {
    if (selectedUser) {
      const ticketNumber = `${ticketType.toUpperCase()}-${Math.floor(
        Math.random() * 10000,
      )}`;

      const updatedUserData = userData.map(user =>
        user.id === selectedUser.id
          ? {
              ...user,
              sign_off_status: 'rejected',
              sign_off_by: currentUser,
              sign_off_date: new Date().toISOString(),
              ticket_reference: ticketNumber,
              comments,
              ticket_status: 'New',
              access_change_date: new Date().toISOString(),
            }
          : user,
      );

      const updatedUser = updatedUserData.find(u => u.id === selectedUser.id);

      setUserData(updatedUserData);
      if (updatedUser) {
        await postAuditUpdate(updatedUser, discoveryApi, fetchApi);
      }
    }

    setDialogOpen(false);
    setSelectedUser(null);
  };

  const handleBulkRejectSubmit = async (
    ticketType: string,
    comments: string,
  ) => {
    const ticketNumber = `${ticketType.toUpperCase()}-${Math.floor(
      Math.random() * 10000,
    )}`;

    const updated = userData.map(d =>
      selectedRows.some(s => s.id === d.id)
        ? {
            ...d,
            sign_off_status: 'rejected',
            sign_off_by: currentUser,
            sign_off_date: new Date().toISOString(),
            ticket_reference: ticketNumber,
            comments,
            ticket_status: 'rejected',
            access_change_date: new Date().toISOString(),
          }
        : d,
    );

    const updatedUsers = updated.filter(d =>
      selectedRows.some(s => s.id === d.id),
    );

    await postAuditUpdate(updatedUsers, discoveryApi, fetchApi);
    setUserData(updated);
    setSelectedRows([]);
    setDialogOpen(false);
  };

  const handleBulkApprove = async () => {
    const updated = userData.map(d =>
      selectedRows.some(s => s.id === d.id)
        ? {
            ...d,
            sign_off_status: 'approved',
            sign_off_by: currentUser,
            sign_off_date: new Date().toISOString(),
            ticket_status: 'approved',
            access_change_date: new Date().toISOString(),
          }
        : d,
    );

    const updatedUsers = updated.filter(d =>
      selectedRows.some(s => s.id === d.id),
    );

    await postAuditUpdate(updatedUsers, discoveryApi, fetchApi);
    setUserData(updated);
    setSelectedRows([]);
  };

  const handleBulkReject = () => {
    if (selectedRows.length > 0) {
      setSelectedUser(selectedRows[0]);
      setDialogOpen(true);
    }
  };

  const handleEmailSendSuccess = () => {
    alertApi.post({ message: 'Email sent successfully!', severity: 'success' });
    setSendEmailModalOpen(false);
  };

  const allColumns: TableColumn<UserAccessData>[] = [
    { title: 'User ID', field: 'user_id', hidden: !showDetails },
    { title: 'Full Name', field: 'full_name' },
    { title: 'App Name', field: 'app_name' },
    { title: 'Period', field: 'period' },
    { title: 'Environment', field: 'environment' },
    { title: 'User Role', field: 'user_role' },
    { title: 'Manager', field: 'manager' },
    { title: 'Custom Reviewer', field: 'app_delegate' },
    {
      title: 'Status',
      field: 'sign_off_status',
      render: rowData => {
        let chipStyle = {};
        if (rowData.sign_off_status === 'approved') {
          chipStyle = { backgroundColor: '#d1f1bb' };
        } else if (rowData.sign_off_status === 'rejected') {
          chipStyle = { backgroundColor: '#fbc5c5' };
        } else {
          chipStyle = { backgroundColor: '#cbc9c9' };
        }
        return (
          <Chip
            label={rowData.sign_off_status}
            style={{ textTransform: 'capitalize', ...chipStyle }}
          />
        );
      },
    },
    { title: 'Account Source', field: 'source' },
    { title: 'Frequency', field: 'frequency' },
    { title: 'Approval Date', field: 'sign_off_date' },
    { title: 'Created At', field: 'created_at' },
    { title: 'Ticket ID', field: 'ticket_reference', hidden: !showDetails },
    { title: 'Ticket Status', field: 'ticket_status', hidden: !showDetails },
    {
      title: 'Comments',
      field: 'comments',
      hidden: !showDetails,
      render: rowData => (
        <TextField
          value={rowData.comments || ''}
          onChange={e => {
            const updated = userData.map(d =>
              d.id === rowData.id ? { ...d, comments: e.target.value } : d,
            );
            setUserData(updated);
          }}
          multiline
          variant="outlined"
          size="small"
          fullWidth
        />
      ),
    },
    {
      title: 'Date of Access Revoked or Added',
      field: 'access_change_date',
      hidden: !showDetails,
    },
  ];

  const actionColumn: TableColumn<UserAccessData> = {
    title: 'Actions',
    render: row => (
      <Box display="flex" margin={2}>
        <Button
          variant="contained"
          color="primary"
          style={{ margin: '0 10px' }}
          size="small"
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
  };

  const columns = [...allColumns, actionColumn];

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
                  onClick={handleBulkReject}
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
                      onChange={() => setShowDetails(prev => !prev)}
                      color="primary"
                    />
                  }
                  label="Show Full Details"
                />
              </Grid>
            </Grid>

            <BackstageTable
              title="Access Reviews"
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
                    exportFunc: (col, rData) =>
                      exportCsv(col, rData, `csv_${new Date().getTime()}`),
                  },
                ],
              }}
              onSelectionChange={rows =>
                setSelectedRows(rows as UserAccessData[])
              }
              columns={columns}
              data={userData}
            />
          </>
        )}

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
      </Content>
    </Page>
  );
}
