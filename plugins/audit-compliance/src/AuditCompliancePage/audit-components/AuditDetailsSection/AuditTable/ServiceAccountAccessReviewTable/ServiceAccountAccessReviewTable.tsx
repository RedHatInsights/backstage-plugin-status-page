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
  Link,
  Switch,
  TextField,
  Typography,
} from '@material-ui/core';
import GitHubIcon from '@material-ui/icons/GitHub';
import PersonIcon from '@material-ui/icons/Person';
import EditIcon from '@material-ui/icons/Edit';
import { useEffect, useState } from 'react';
import EmailModal from '../../../Modals/EmailModal/EmailModal';
import JiraModal from '../../../Modals/JiraModal';
import { AuditTablePropsWithCounts, ServiceAccountData } from './types';
import { useStyles } from './styles';

export default function ServiceAccountAccessReviewTable({
  frequency,
  period,
  app_name,
  setCounts,
  isFinalSignedOff = false,
  isAuditCompleted = false,
}: AuditTablePropsWithCounts) {
  const [data, setData] = useState<ServiceAccountData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<ServiceAccountData[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sendEmailModalOpen, setSendEmailModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ServiceAccountData | null>(
    null,
  );
  const [initialDescription, setInitialDescription] = useState('');
  const [initialTitle, setInitialTitle] = useState('');
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
  const alertApi = useApi(alertApiRef);
  const configApi = useApi(configApiRef);
  const identityApi = useApi(identityApiRef);
  const [currentUser, setCurrentUser] = useState<string>('');
  const jiraUrl = configApi.getString('auditCompliance.jiraUrl');
  const classes = useStyles();
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

  const handleEmailSendSuccess = () => {
    alertApi.post({ message: 'Email sent successfully!', severity: 'success' });
    setSendEmailModalOpen(false);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
      const response = await fetchApi.fetch(
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

      if (!response.ok) {
        throw new Error('Failed to fetch service account access reviews');
      }

      const reviews = await response.json();
      setData(reviews);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching service account reviews:', error);
      alertApi.post({
        message: 'Failed to fetch service account access reviews',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app_name, frequency, period]);

  // Update counts after data load or update
  useEffect(() => {
    const total = data.length;
    const approved = data.filter(d => d.sign_off_status === 'approved').length;
    const rejected = data.filter(d => d.sign_off_status === 'rejected').length;
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
  }, [data, setCounts]);

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
    const { tableData, ...cleanUser } = user;
    const updatedUser: ServiceAccountData = {
      ...cleanUser,
      user_id: user.user_id || user.service_account,
      source: user.source,
      sign_off_status: 'approved' as const,
      sign_off_by: currentUser,
      sign_off_date: new Date().toISOString(),
      ticket_reference: '', // Clear ticket info on approval
      ticket_status: '',
      comments: '',
    };

    try {
      await postUpdate(updatedUser);
      alertApi.post({
        message: `Access approved for service account ${user.service_account}`,
        severity: 'success',
        display: 'transient',
      });
      // Refresh data after successful update to get latest Jira statuses
      await fetchData();
    } catch (error) {
      alertApi.post({
        message: 'Failed to update service account data.',
        severity: 'error',
        display: 'transient',
      });
    }
  };

  const handleReject = (user: ServiceAccountData) => {
    const source = user.source || 'GITLAB';
    const title = `[${user.app_name}-${period} AQR] : Rejection of access for Service Account: ${user.service_account}`;
    const description = `This Jira ticket is created for ${frequency} ${period} AQR review for application ${user.app_name} for the removal of service account: ${user.service_account} from ${source}`;
    setSelectedUser(user);
    setInitialTitle(title);
    setInitialDescription(description);
    setDialogOpen(true);
  };

  const handleBulkReject = () => {
    if (selectedRows.length > 0) {
      const firstUser = selectedRows[0];
      const title = `[${firstUser.app_name}-${period} AQR] : Bulk Rejection of access for ${selectedRows.length} service accounts`;
      const description = `This Jira ticket is created for ${frequency} ${period} AQR review for application ${
        firstUser.app_name
      } for the removal of multiple service accounts: ${selectedRows
        .map(row => row.service_account)
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
    try {
      // Extract current user UID from userEntityRef (format: user:redhat/username)
      const currentUserUid = currentUser.split('/')[1] || '';

      // Prepare the data to be sent to the backend for Jira ticket creation
      const ticketData = {
        user_id: selectedUser.service_account,
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

      const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
      const response = await fetchApi.fetch(
        `${baseUrl}/create-service-account-ticket`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(ticketData),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`,
        );
      }

      const result = await response.json();
      const { key: ticketId, status } = result;

      // Update only the selected service accounts with the same ticket info
      const usersToUpdate =
        selectedRows.length > 0 ? selectedRows : [selectedUser];
      const updatedUsers: ServiceAccountData[] = usersToUpdate.map(user => {
        const { tableData, ...cleanUser } = user;
        return {
          ...cleanUser,
          sign_off_status: 'rejected' as const,
          sign_off_by: currentUser,
          sign_off_date: new Date().toISOString(),
          ticket_reference: ticketId,
          ticket_status: status,
          comments,
          revoked_date: new Date().toISOString(),
        };
      });

      // Update the database for only the selected users
      const updateResponse = await fetchApi.fetch(
        `${baseUrl}/service_account_access_review`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedUsers),
        },
      );

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Failed to update database! status: ${updateResponse.status}`,
        );
      }

      alertApi.post({
        message: `Jira ticket created and ${updatedUsers.length} service account(s) rejected successfully`,
        severity: 'success',
        display: 'transient',
      });

      // Update local state for only the selected rows
      setData(prevData =>
        prevData.map(d => {
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
    }
  };

  const handleBulkApprove = async () => {
    const approvedUsers: ServiceAccountData[] = selectedRows.map(user => {
      const { tableData, ...cleanUser } = user;
      return {
        ...cleanUser,
        user_id: user.user_id || user.service_account,
        source: user.source,
        sign_off_status: 'approved' as const,
        sign_off_by: currentUser,
        sign_off_date: new Date().toISOString(),
        ticket_reference: '', // Clear ticket info on approval
        ticket_status: '',
        comments: '',
      };
    });

    try {
      const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
      await fetchApi.fetch(`${baseUrl}/service_account_access_review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(approvedUsers),
      });

      alertApi.post({
        message: `Access approved for ${selectedRows.length} selected service accounts`,
        severity: 'success',
        display: 'transient',
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
        message: 'Failed to approve selected service accounts.',
        severity: 'error',
        display: 'transient',
      });
    }
  };

  const handleCommentUpdate = async (row: ServiceAccountData) => {
    setCommentUpdateLoading(prev => ({ ...prev, [row.id]: true }));
    try {
      const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
      const payload = {
        id: row.id,
        comments: row.comments,
        ticket_reference: row.ticket_reference,
      };
      const response = await fetchApi.fetch(
        `${baseUrl}/jira/service-account/comment`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
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
      setCommentUpdateLoading(prev => ({ ...prev, [row.id]: false }));
    }
  };

  const columns: TableColumn<ServiceAccountData>[] = [
    { title: 'User ID', field: 'service_account' },
    { title: 'Application', field: 'app_name' },
    { title: 'Environment', field: 'environment' },
    { title: 'Role', field: 'user_role' },
    { title: 'Manager', field: 'manager' },
    {
      title: 'Custom Reviewer',
      field: 'app_delegate',
      render: rowData => {
        if (!rowData.app_delegate) return 'No delegate assigned';
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
      title: 'Account Source',
      field: 'source',
      render: (rowData: ServiceAccountData) => {
        const source = rowData.source?.toLowerCase();
        let icon = <PersonIcon />;

        if (source === 'rover') {
          icon = <PersonIcon />;
        } else if (source === 'gitlab') {
          icon = <GitHubIcon />;
        } else if (source === 'ldap') {
          icon = <PersonIcon />;
        } else if (source === 'manual') {
          icon = <EditIcon />;
        }

        return (
          <Chip
            icon={icon}
            label={rowData.source}
            variant="outlined"
            size="small"
            className={classes.sourceChip}
            title={
              source === 'manual'
                ? 'Manual entry - cannot be automatically verified'
                : undefined
            }
          />
        );
      },
    },
    {
      title: 'Status',
      field: 'sign_off_status',
      render: (rowData: ServiceAccountData) => {
        let color = '#ccc';
        if (rowData.sign_off_status === 'approved') color = '#d1f1bb';
        else if (rowData.sign_off_status === 'rejected') color = '#fbc5c5';
        return (
          <Chip
            label={rowData.sign_off_status}
            style={{ backgroundColor: color }}
          />
        );
      },
    },
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
    { title: 'Sign-off Date', field: 'sign_off_date' },
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
        <Box>
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
          {row.sign_off_status === 'rejected' && row.ticket_reference && (
            <Button
              variant="contained"
              size="small"
              onClick={() => handleCommentUpdate(row)}
              disabled={commentUpdateLoading[row.id]}
              style={{ minWidth: '80px', marginTop: '8px' }}
            >
              {commentUpdateLoading[row.id] ? (
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
      title: 'Access Revoked Date',
      field: 'revoked_date',
      hidden: !showDetails,
    },
    { title: 'Created At', field: 'created_at', hidden: !showDetails },
    { title: 'Updated At', field: 'updated_at', hidden: !showDetails },
    {
      title: 'Actions',
      render: row => (
        <Box display="flex">
          <Button
            variant="outlined"
            size="small"
            style={{
              margin: '0 10px',
              borderColor: '#4caf50',
              color: '#4caf50',
            }}
            onClick={() => handleApprove(row)}
            disabled={isAuditCompleted || isFinalSignedOff}
          >
            Approve
          </Button>
          <Button
            variant="outlined"
            size="small"
            style={{
              margin: '0 10px',
              borderColor: '#f44336',
              color: '#f44336',
            }}
            onClick={() => handleReject(row)}
            disabled={isAuditCompleted || isFinalSignedOff}
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
        {/* Progress Bar for Completion */}
        {data.length > 0 &&
          (() => {
            const total = data.length;
            const approved = data.filter(
              d => d.sign_off_status === 'approved',
            ).length;
            const rejected = data.filter(
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
          })()}
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
                  onChange={e => setShowDetails(e.target.checked)}
                />
              }
              label="Show Details"
            />
          </Grid>
        </Grid>
        {loading ? (
          <CircularProgress />
        ) : (
          <>
            <BackstageTable
              options={{
                paging: true,
                pageSize: 5,
                pageSizeOptions: [5, 10, 25, 50, data.length],
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
              onClose={() => {
                setDialogOpen(false);
                setSelectedUser(null);
                setInitialDescription('');
                setInitialTitle('');
              }}
              onSubmit={handleTicketSubmit}
              initialDescription={initialDescription}
              initialTitle={initialTitle}
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
          </>
        )}
      </Content>
    </Page>
  );
}
