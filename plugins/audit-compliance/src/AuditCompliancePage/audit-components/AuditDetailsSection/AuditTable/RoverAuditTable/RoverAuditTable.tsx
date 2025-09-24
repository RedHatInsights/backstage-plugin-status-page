// Imports
import {
  Table as BackstageTable,
  Content,
  Page,
  TableColumn,
} from '@backstage/core-components';
import { EntityDisplayName } from '@backstage/plugin-catalog-react';
import {
  alertApiRef,
  configApiRef,
  DiscoveryApi,
  discoveryApiRef,
  FetchApi,
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
  Link,
  Switch,
  TextField,
  Typography,
} from '@material-ui/core';
import GitHubIcon from '@material-ui/icons/GitHub';
import PersonIcon from '@material-ui/icons/Person';
import { useEffect, useState } from 'react';
import EmailModal from '../../../Modals/EmailModal/EmailModal';
import JiraModal from '../../../Modals/JiraModal';
import { useStyles } from './styles';
import { AuditTablePropsWithCounts, UserAccessData } from './types';

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
  setCounts,
  isFinalSignedOff = false,
  isAuditCompleted = false,
}: AuditTablePropsWithCounts) {
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
  const alertApi = useApi(alertApiRef);
  const identityApi = useApi(identityApiRef);
  const configApi = useApi(configApiRef);
  const jiraUrl = configApi.getString('auditCompliance.jiraUrl');
  const classes = useStyles();

  const [userData, setUserData] = useState<UserAccessData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<UserAccessData[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAccessData | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [sendEmailModalOpen, setSendEmailModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState('User');
  const [initialDescription, setInitialDescription] = useState('');
  const [initialTitle, setInitialTitle] = useState('');
  const [ticketLoading, setTicketLoading] = useState(false);
  const [commentUpdateLoading, setCommentUpdateLoading] = useState<
    Record<number, boolean>
  >({});

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

      const response = await fetchApi.fetch(
        `${baseUrl}/access-reviews?app_name=${encodeURIComponent(
          app_name,
        )}&frequency=${encodeURIComponent(
          frequency,
        )}&period=${encodeURIComponent(period)}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const data = await response.json();
      setUserData(data || []);
    } catch (error) {
      alertApi.post({
        message: 'Failed to fetch access reviews',
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

  // Update counts after data load or update
  useEffect(() => {
    const total = userData.length;
    const approved = userData.filter(
      d => d.sign_off_status === 'approved',
    ).length;
    const rejected = userData.filter(
      d => d.sign_off_status === 'rejected',
    ).length;
    const completed = approved + rejected;
    const pending = total - completed;

    if (setCounts) {
      setCounts({
        completed,
        total,
        pending,
        approved,
        rejected,
      });
    }
  }, [userData, setCounts]);

  const handleApprove = async (user: UserAccessData) => {
    const { tableData, ...cleanUser } = user as any;

    const updatedUser = {
      ...cleanUser,
      user_id: user.user_id,
      source: user.source,
      sign_off_status: 'approved',
      sign_off_by: currentUser,
      sign_off_date: new Date().toISOString(),
      access_change_date: new Date().toISOString(),
      ticket_reference: '', // Clear ticket info on approval
      ticket_status: '',
      comments: '',
    };

    const updatedUserData = userData.map(d =>
      d.id === user.id ? updatedUser : d,
    );

    setUserData(updatedUserData);
    try {
      await postAuditUpdate(updatedUser, discoveryApi, fetchApi);
      alertApi.post({
        message: `Access approved for user ${user.full_name}`,
        severity: 'success',
        display: 'transient',
      });
    } catch {
      alertApi.post({
        message: 'Approval failed.',
        severity: 'error',
        display: 'transient',
      });
    }
  };

  const handleReject = (user: UserAccessData) => {
    const title = `[${user.app_name}-${period} AQR] : Rejection of access for ${
      user.full_name
    } (${user.user_id}) for source - ${user.source} : ${
      user.account_name || 'N/A'
    }`;
    const description = `This Jira ticket is created for ${frequency} ${period} AQR review for application ${
      user.app_name
    } for the removal of user: ${user.full_name} (${user.user_id}) from ${
      user.source
    } for account ${user.account_name || 'N/A'} `;
    setSelectedUser(user);
    setInitialTitle(title);
    setInitialDescription(description);
    setDialogOpen(true);
  };

  const handleBulkReject = () => {
    if (selectedRows.length > 0) {
      const firstUser = selectedRows[0];
      const title = `[${firstUser.app_name}-${period} AQR] : Bulk Rejection of access for ${selectedRows.length} users`;
      const description = `This Jira ticket is created for ${frequency} ${period} AQR review for application ${
        firstUser.app_name
      } for the removal of multiple users: ${selectedRows
        .map(row => `${row.full_name} (${row.source} - ${row.account_name})`)
        .join(', ')}`;
      setSelectedUser(firstUser);
      setInitialTitle(title);
      setInitialDescription(description);
      setDialogOpen(true);
    }
  };

  const handleTicketSubmit = async (
    _ticketType: string,
    description: string,
    comments: string,
  ) => {
    if (!selectedUser) return;

    setTicketLoading(true);
    try {
      // Extract current user UID from userEntityRef (format: user:redhat/username)
      const currentUserUid = currentUser.split('/')[1] || '';

      // Prepare the data to be sent to the backend
      const ticketData = {
        user_id: selectedUser.user_id,
        app_name: selectedUser.app_name,
        period,
        frequency,
        title: initialTitle,
        description,
        comments,
        manager_name: selectedUser.manager,
        manager_uid: selectedUser.manager_uid,
        current_user_uid: currentUserUid,
      };

      // Use fetchApi.fetch to create the Jira ticket
      const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
      const response = await fetchApi.fetch(`${baseUrl}/create-aqr-ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ticketData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            'Failed to create Jira ticket while executing rejection.',
        );
      }

      const result = await response.json();
      const { key: ticketId, status } = result;

      // Determine which users to update - only the selected rows
      const usersToUpdate =
        selectedRows.length > 0 ? selectedRows : [selectedUser];

      // Update only the selected users with the same ticket information
      const updatedUsers = usersToUpdate.map(user => {
        const { tableData, ...cleanUser } = user as any;
        return {
          ...cleanUser,
          sign_off_status: 'rejected',
          sign_off_by: currentUser,
          sign_off_date: new Date().toISOString(),
          ticket_reference: ticketId,
          ticket_status: status,
          comments,
          access_change_date: new Date().toISOString(),
        };
      });

      // Update the database for only the selected users
      await postAuditUpdate(updatedUsers, discoveryApi, fetchApi);

      alertApi.post({
        message: `Jira ticket created and ${updatedUsers.length} user(s) rejected successfully`,
        severity: 'success',
        display: 'transient',
      });

      // Update the local state for only the selected users
      setUserData(prev =>
        prev.map(d => {
          const updatedUser = updatedUsers.find(u => u.id === d.id);
          return updatedUser || d;
        }),
      );

      setDialogOpen(false);
      setSelectedUser(null);
      setInitialDescription('');
      setInitialTitle('');
      setSelectedRows([]);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error in ticket creation:', error);
      alertApi.post({
        message:
          error instanceof Error
            ? error.message
            : 'Failed to create Jira ticket or update database',
        severity: 'error',
        display: 'transient',
      });
      setDialogOpen(false);
      setSelectedUser(null);
      setInitialDescription('');
      setInitialTitle('');
    } finally {
      setTicketLoading(false);
    }
  };

  const handleBulkApprove = async () => {
    const updated = userData.map(d =>
      selectedRows.some(s => s.id === d.id)
        ? {
            ...d,
            user_id: d.user_id,
            source: d.source,
            sign_off_status: 'approved',
            sign_off_by: currentUser,
            sign_off_date: new Date().toISOString(),
            access_change_date: new Date().toISOString(),
            ticket_reference: '', // Clear ticket info on approval
            ticket_status: '',
            comments: '',
          }
        : d,
    );

    const updatedUsers = updated.filter(d =>
      selectedRows.some(s => s.id === d.id),
    );

    try {
      await postAuditUpdate(updatedUsers, discoveryApi, fetchApi);
      setUserData(updated);
      setSelectedRows([]);
      alertApi.post({
        message: `Access approved for ${selectedRows.length} selected users`,
        severity: 'success',
        display: 'transient',
      });
    } catch (error) {
      alertApi.post({
        message: 'Failed to approve selected users.',
        severity: 'error',
        display: 'transient',
      });
    }
  };

  const handleCommentUpdate = async (user: UserAccessData) => {
    setCommentUpdateLoading(prev => ({ ...prev, [user.id]: true }));
    try {
      const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
      const payload = {
        id: user.id,
        comments: user.comments,
        ticket_reference: user.ticket_reference,
      };

      const response = await fetchApi.fetch(`${baseUrl}/jira/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update Jira comment.');
      }

      alertApi.post({
        message: 'Comment updated successfully in Jira.',
        severity: 'success',
        display: 'transient',
      });
    } catch (error) {
      alertApi.post({
        message:
          error instanceof Error ? error.message : 'Failed to update comment.',
        severity: 'error',
        display: 'transient',
      });
    } finally {
      setCommentUpdateLoading(prev => ({ ...prev, [user.id]: false }));
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
    {
      title: 'Custom Reviewer',
      field: 'app_delegate',
      render: rowData => {
        if (!rowData.app_delegate) return null;
        return (
          <EntityDisplayName
            entityRef={{
              name: rowData.app_delegate,
              kind: 'User',
              namespace: 'redhat',
            }}
          />
        );
      },
    },
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
            label={
              rowData.sign_off_status?.charAt(0).toUpperCase() +
              rowData.sign_off_status?.slice(1)
            }
            style={{ textTransform: 'capitalize', ...chipStyle }}
          />
        );
      },
    },
    {
      title: 'Account Source',
      field: 'source',
      render: rowData => {
        const source = rowData.source?.toLowerCase();
        const icon = source === 'gitlab' ? <GitHubIcon /> : <PersonIcon />;
        return (
          <Chip
            icon={icon}
            label={rowData.source}
            variant="outlined"
            size="small"
            className={classes.sourceChip}
          />
        );
      },
    },
    { title: 'Account Name', field: 'account_name' },
    { title: 'Frequency', field: 'frequency' },
    { title: 'Approval Date', field: 'sign_off_date' },
    {
      title: 'Approved By',
      field: 'sign_off_by',
      render: rowData => {
        if (
          !rowData.sign_off_by ||
          rowData.sign_off_by === '' ||
          rowData.sign_off_by === 'N/A'
        ) {
          return rowData.sign_off_by || 'N/A';
        }

        // Extract username from entity reference (e.g., "user:redhat/yoswal" -> "yoswal")
        const username = rowData.sign_off_by.includes('user:redhat/')
          ? rowData.sign_off_by.replace('user:redhat/', '')
          : rowData.sign_off_by;

        return (
          <EntityDisplayName
            entityRef={{
              name: username,
              kind: 'User',
              namespace: 'redhat',
            }}
          />
        );
      },
    },
    { title: 'Created At', field: 'created_at' },
    {
      title: 'Ticket ID',
      field: 'ticket_reference',
      hidden: !showDetails,
      render: rowData => {
        if (!rowData.ticket_reference) return null;
        return (
          <Link
            href={`${jiraUrl}/browse/${rowData.ticket_reference}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {rowData.ticket_reference}
          </Link>
        );
      },
    },
    { title: 'Ticket Status', field: 'ticket_status', hidden: !showDetails },
    {
      title: 'Comments',
      field: 'comments',
      hidden: !showDetails,
      render: rowData => (
        <Box>
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
          {rowData.sign_off_status === 'rejected' &&
            rowData.ticket_reference && (
              <Button
                variant="contained"
                size="small"
                onClick={() => handleCommentUpdate(rowData)}
                disabled={commentUpdateLoading[rowData.id]}
                style={{ minWidth: '80px', marginTop: '8px' }}
              >
                {commentUpdateLoading[rowData.id] ? (
                  <CircularProgress size={20} />
                ) : (
                  'Update'
                )}
              </Button>
            )}
        </Box>
      ),
    },
    {
      title: 'Access Changed Date',
      field: 'access_change_date',
      hidden: !showDetails,
    },
  ];

  const actionColumn: TableColumn<UserAccessData> = {
    title: 'Actions',
    render: row => (
      <Box display="flex" margin={2}>
        <Button
          variant="outlined"
          style={{
            margin: '0 10px',
            borderColor: '#4caf50',
            color: '#4caf50',
          }}
          size="small"
          onClick={() => handleApprove(row)}
          disabled={isAuditCompleted || isFinalSignedOff}
        >
          Approve
        </Button>
        <Button
          variant="outlined"
          style={{
            margin: '0 10px',
            borderColor: '#f44336',
            color: '#f44336',
          }}
          size="small"
          onClick={() => handleReject(row)}
          disabled={isAuditCompleted || isFinalSignedOff}
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
        {/* Progress Bar for Completion */}
        {userData.length > 0
          ? (() => {
              const total = userData.length;
              const approved = userData.filter(
                d => d.sign_off_status === 'approved',
              ).length;
              const rejected = userData.filter(
                d => d.sign_off_status === 'rejected',
              ).length;
              const completed = approved + rejected;
              const pending = total - completed;
              const percent = (completed / total) * 100;
              return (
                <Box mb={3}>
                  <Typography variant="subtitle1" gutterBottom>
                    {`${completed} of ${total} completed`}
                    {isFinalSignedOff && (
                      <Typography
                        component="span"
                        style={{ marginLeft: 8, color: 'green' }}
                      >
                        (Final Sign-off Completed)
                      </Typography>
                    )}
                  </Typography>
                  <Box display="flex" alignItems="center">
                    <Box flexGrow={1} mr={2}>
                      <Box position="relative">
                        <Box
                          position="absolute"
                          top={0}
                          left={0}
                          width="100%"
                          height={10}
                          zIndex={1}
                        >
                          <Box
                            width="100%"
                            height={10}
                            bgcolor="#e0e0e0"
                            borderRadius={5}
                          />
                        </Box>
                        <Box
                          position="absolute"
                          top={0}
                          left={0}
                          height={10}
                          borderRadius={5}
                          zIndex={2}
                          width={`${percent}%`}
                          bgcolor="#4caf50"
                        />
                        <Box height={10} visibility="hidden" />
                      </Box>
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      {pending} remaining
                    </Typography>
                  </Box>
                </Box>
              );
            })()
          : null}

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
              style={{
                borderColor: '#4caf50',
                color: '#4caf50',
              }}
              disabled={
                selectedRows.length === 0 ||
                isAuditCompleted ||
                isFinalSignedOff
              }
              onClick={handleBulkApprove}
            >
              Approve Selected
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              style={{
                borderColor: '#f44336',
                color: '#f44336',
              }}
              disabled={
                selectedRows.length === 0 ||
                isAuditCompleted ||
                isFinalSignedOff
              }
              onClick={handleBulkReject}
            >
              Reject Selected
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              color="primary"
              disabled={selectedRows.length === 0 || isFinalSignedOff}
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

        {loading ? (
          <CircularProgress />
        ) : (
          <>
            <BackstageTable
              title="Access Reviews"
              options={{
                paging: true,
                pageSize: 5,
                pageSizeOptions: [5, 10, 25, 50, userData.length],
                selection: !isAuditCompleted && !isFinalSignedOff,
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
          onClose={() => {
            setDialogOpen(false);
            setSelectedUser(null);
            setInitialDescription('');
            setInitialTitle('');
          }}
          onSubmit={handleTicketSubmit}
          initialDescription={initialDescription}
          initialTitle={initialTitle}
          loading={ticketLoading}
        />
        <EmailModal
          open={sendEmailModalOpen}
          app_name={app_name || ''}
          frequency={frequency}
          period={period}
          onClose={() => setSendEmailModalOpen(false)}
          selectedRows={selectedRows}
          currentUser={currentUser}
          onEmailSendSuccess={handleEmailSendSuccess}
        />
      </Content>
    </Page>
  );
}
