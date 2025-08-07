import { identityApiRef, useApi } from '@backstage/core-plugin-api';
import { Progress, ResponseErrorPanel } from '@backstage/core-components';
import {
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Table as MuiTable,
  Paper,
  Select,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@material-ui/core';
import { useEffect, useState } from 'react';
import { permissionManagementApiRef } from '../../api';
import { oauth2ApiRef } from '../../plugin';
import { 
    TableNoAdminRequestsEmptyState,
    TableNoFilteredResultsEmptyState
} from '../Common';

interface AccessRequest {
  id: string;
  userName: string;
  userEmail: string;
  userId: string;
  group: string;
  role: string;
  reason: string;
  rejectionReason: string;
  reviewer: string;
  createdAt: string;
  updatedAt: string;
  status: string;
}

export const PermissionManagementComponent = () => {
  const permissionApi = useApi(permissionManagementApiRef);
  const identityApi = useApi(identityApiRef);
  const oauth2Api = useApi(oauth2ApiRef);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalIds, setApprovalIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy] = useState<keyof AccessRequest | null>(null);
  const [sortDirection] = useState<'asc' | 'desc'>('asc');
  const [roleFilter, setRoleFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending'); 
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [reviewerEmail, setReviewerEmail] = useState<string>('');
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    const fetchAuth = async () => {
      const token = await oauth2Api.getAccessToken();
      const payload = JSON.parse(atob(token.split('.')[1]));
      setAccessToken(token || null);
      setReviewerEmail(`${payload.uid}@redhat.com` || '');
    };
    fetchAuth();
  }, [identityApi, oauth2Api]);

  const refetchRequests = async () => {
    try {
      const all = await permissionApi.getAllAccessRequests();
      setRequests(all);
    } catch (err) {
      const catchError = err as any;
      if (catchError?.status === 204 || catchError?.response?.status === 204) {
        setRequests([]);
      } else {
        setError(err as Error);
      }
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const all = await permissionApi.getAllAccessRequests();
        setRequests(all);
      } catch (err) {
        const fetchError = err as any;
        if (fetchError?.status === 204 || fetchError?.response?.status === 204) {
          setRequests([]);
        } else {
          setError(err as Error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [permissionApi]);


  const handleApprove = async (ids: string[]) => {
    if (!accessToken) return;

    setApproving(true);
    try {
      const updatePayload = ids.flatMap(id => {
        const req = requests.find(r => r.id === id);
        if (!req) return [];
        return [{
          userId: req.userId,
          group: req.group,
          role: req.role,
          status: 'approved' as const,
          rejectionReason: '',
          reviewer: reviewerEmail,
          updatedBy: reviewerEmail,
        }];
      });

      if (updatePayload.length > 0) {
        await permissionApi.updateAccessRequests(updatePayload, accessToken);
      }

      await refetchRequests();
      setSelected([]);
      setApprovalDialogOpen(false);
      setApprovalIds([]);
    } finally {
      setApproving(false);
    }
  };


  const handleReject = async (ids: string[] | null) => {
    if (!accessToken) return;

    setRejecting(true);
    const targetIds = ids ?? selected;

    const updatePayload = targetIds.flatMap(id => {
      const req = requests.find(r => r.id === id);
      if (!req) return [];
      return [{
        userId: req.userId,
        group: req.group,
        role: req.role,
        status: 'rejected' as const,
        rejectionReason,
        reviewer: reviewerEmail,
        updatedBy: reviewerEmail,
      }];
    });

    try {
      if (updatePayload.length > 0) {
        await permissionApi.updateAccessRequests(updatePayload, accessToken);
      }


      await refetchRequests();
      setSelected([]);
      setRejectionDialogOpen(false);
      setRejectionReason('');
      setRejectingId(null);
    } finally {
      setRejecting(false);
    }
  };


  const handleSelect = (id: string, status: string) => {
    if (status !== 'pending') return;
    setSelected(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id],
    );
  };

  const filteredRequests = requests
    .filter(r => {
      const term = searchTerm.toLowerCase();
      return (
        r?.userName?.toLowerCase()?.includes(term) ||
        r?.userId?.toLowerCase()?.includes(term) ||
        r?.group?.toLowerCase()?.includes(term) ||
        r?.role?.toLowerCase()?.includes(term)
      );
    })
    .filter(r => (roleFilter ? r.role === roleFilter : true))
    .filter(r => (groupFilter ? r.group === groupFilter : true))
    .filter(r => (statusFilter ? r.status === statusFilter : true))
    .sort((a, b) => {
      if (!sortBy) return 0;
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();

      if (sortDirection === 'asc') {
        if (aValue < bValue) return -1;
        if (aValue > bValue) return 1;
        return 0;
      }

      if (aValue > bValue) return -1;
      if (aValue < bValue) return 1;
      return 0;
    });

  const handleSelectAll = () => {
    const filteredPendingIds = filteredRequests
      .filter(r => r.status === 'pending')
      .map(r => r.id);

    if (selected.length === filteredPendingIds.length) {
      setSelected([]);
    } else {
      setSelected(filteredPendingIds);
    }
  };


  if (loading) return <Progress />;
  if (error) return <ResponseErrorPanel error={error} />;


  const getRoleColor = (role: string): string => {
    switch (role) {
      case 'owner':
        return '#007bff';
      case 'member':
        return '#6c757d';
      default:
        return '#adb5bd';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'approved':
        return '#28a745';
      case 'rejected':
        return '#dc3545';
      case 'pending':
        return '#6699ff';
      default:
        return 'gray';
    }
  };

  return (
    <Grid container spacing={3} direction="column">
      <Grid container spacing={2} alignItems="center" style={{ marginBottom: 16 }} wrap="nowrap">
        <Grid item xs>
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={2}>
          <FormControl fullWidth variant="outlined" size="small">
            <InputLabel>Role</InputLabel>
            <Select value={roleFilter} onChange={e => setRoleFilter(e.target.value as string)} label="Role">
              <MenuItem value="">All</MenuItem>
              <MenuItem value="owner">Owner</MenuItem>
              <MenuItem value="member">Member</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={2}>
          <FormControl fullWidth variant="outlined" size="small">
            <InputLabel>Group</InputLabel>
            <Select value={groupFilter} onChange={e => setGroupFilter(e.target.value as string)} label="Group">
              <MenuItem value="">All</MenuItem>
              {[...new Set(requests.map(r => r.group))].map(group => (
                <MenuItem key={group} value={group}>{group}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={2}>
          <FormControl fullWidth variant="outlined" size="small">
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value as string)} label="Status">
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
              <MenuItem value="">All</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item>
          <Button variant="contained" color="primary" onClick={() => {
            setApprovalIds(selected);
            setApprovalDialogOpen(true);
          }} disabled={selected.length === 0}>Approve Selected</Button>
        </Grid>
        <Grid item>
          <Button variant="contained" color="secondary" onClick={() => {
            setRejectionDialogOpen(true);
            setRejectingId(null);
          }} disabled={selected.length === 0}>Reject Selected</Button>
        </Grid>
      </Grid>

      <Paper style={{ overflowX: 'auto' }}>
        <MuiTable>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selected.length > 0 && selected.length === filteredRequests.filter(r => r.status === 'pending').length}
                  indeterminate={selected.length > 0 && selected.length < filteredRequests.filter(r => r.status === 'pending').length}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell>Username</TableCell>
              <TableCell>User ID</TableCell>
              <TableCell>Group</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
              <TableCell>View Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(() => {
              if (requests.length === 0) {
                return <TableNoAdminRequestsEmptyState colSpan={8} onRefresh={refetchRequests} />;
              }
              if (filteredRequests.length === 0) {
                return <TableNoFilteredResultsEmptyState colSpan={8} onRefresh={refetchRequests} />;
              }
              return filteredRequests.map(request => (
              <TableRow key={request.id} hover>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selected.includes(request.id)}
                    disabled={request.status !== 'pending'}
                    onChange={() => handleSelect(request.id, request.status)}
                  />
                </TableCell>
                <TableCell>{request.userName}</TableCell>
                <TableCell>{request.userId}</TableCell>
                <TableCell>{request.group}</TableCell>
                <TableCell>  <Chip
                  label={request.role}
                  style={{
                    backgroundColor: getRoleColor(request.role),
                    color: 'white',
                    textTransform: 'capitalize',
                    fontWeight: 500,
                  }}
                /></TableCell>
                <TableCell>{request.createdAt}</TableCell>
                <TableCell>
                  <Chip
                    label={request.status}
                    style={{
                      backgroundColor: getStatusColor(request.status),
                      color: 'white',
                      textTransform: 'capitalize',
                      fontWeight: 500,
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    size="small"
                    style={request.status === 'pending' ? { borderColor: 'green', color: 'green', marginRight: 8 } : { borderColor: 'gray', color: 'gray', marginRight: 8 }}
                    disabled={request.status !== 'pending'}
                    onClick={() => {
                      setApprovalIds([request.id]);
                      setApprovalDialogOpen(true);
                    }}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    style={request.status === 'pending' ? { borderColor: 'red', color: 'red' } : { borderColor: 'gray', color: 'gray' }}
                    disabled={request.status !== 'pending'}
                    onClick={() => {
                      setRejectionDialogOpen(true);
                      setRejectingId(request.id);
                    }}
                  >
                    Reject
                  </Button>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setSelectedRequest(request);
                      setDrawerOpen(true);
                    }}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
              ));
            })()}
          </TableBody>
        </MuiTable>
      </Paper>

      <Dialog open={rejectionDialogOpen} onClose={() => setRejectionDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Rejection Reason</DialogTitle>
        <DialogContent>
          <TextField
            multiline
            fullWidth
            rows={4}
            label={`Reason for rejecting ${rejectingId ? 'this request' : `${selected.length} requests`}`}
            value={rejectionReason}
            onChange={e => setRejectionReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectionDialogOpen(false)}>Cancel</Button>
          <Button
            color="secondary"
            onClick={() => handleReject(rejectingId ? [rejectingId] : null)}
            disabled={rejecting}
            startIcon={rejecting && <CircularProgress size={20} />}
          >
            {rejecting ? 'Rejecting...' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={approvalDialogOpen} onClose={() => setApprovalDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Approval</DialogTitle>
        <DialogContent>
          Are you sure you want to approve {approvalIds.length} request{approvalIds.length > 1 ? 's' : ''}?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialogOpen(false)}>Cancel</Button>
          <Button
            color="primary"
            onClick={() => handleApprove(approvalIds)}
            disabled={approving}
            startIcon={approving && <CircularProgress size={20} />}
          >
            {approving ? 'Approving...' : 'Confirm'}
          </Button>

        </DialogActions>
      </Dialog>

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <div style={{ width: 420, padding: 24 }}>
          <Typography variant="h5" gutterBottom>
            Access Request Details
          </Typography>
          <Divider style={{ marginBottom: 16 }} />

          {selectedRequest ? (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary">
                  User Name: <span style={{ fontWeight: 400 }}>{selectedRequest.userName || 'N/A'}</span>
                </Typography>

                <Typography variant="subtitle2" color="textSecondary">
                  User Email: <span style={{ fontWeight: 400 }}>{selectedRequest.userEmail || 'N/A'}</span>
                </Typography>

                <Typography variant="subtitle2" color="textSecondary">
                  User ID: <span style={{ fontWeight: 400 }}>{selectedRequest.userId || 'N/A'}</span>
                </Typography>

                <Typography variant="subtitle2" color="textSecondary">
                  Group: <span style={{ fontWeight: 400 }}>{selectedRequest.group || 'N/A'}</span>
                </Typography>

                <Typography variant="subtitle2" color="textSecondary">
                  Role: <span style={{ fontWeight: 400 }}>{selectedRequest.role || 'N/A'}</span>
                </Typography>

                <Typography variant="subtitle2" color="textSecondary">
                  Reason for Request: <span style={{ fontWeight: 400 }}>{selectedRequest.reason || 'N/A'}</span>
                </Typography>

                <Typography variant="subtitle2" color="textSecondary">
                  Rejection Reason: <span style={{ fontWeight: 400 }}>{selectedRequest.rejectionReason || 'N/A'}</span>
                </Typography>

                <Typography variant="subtitle2" color="textSecondary">
                  Reviewer: <span style={{ fontWeight: 400 }}>{selectedRequest.reviewer || 'N/A'}</span>
                </Typography>

                <Typography variant="subtitle2" color="textSecondary">
                  Created At: <span style={{ fontWeight: 400 }}>{selectedRequest.createdAt || 'N/A'}</span>
                </Typography>

                <Typography variant="subtitle2" color="textSecondary">
                  Updated At: <span style={{ fontWeight: 400 }}>{selectedRequest.updatedAt || 'N/A'}</span>
                </Typography>

                <Typography variant="subtitle2" color="textSecondary" style={{ marginTop: 8 }}>
                  Status:
                  <Chip
                    label={selectedRequest.status || 'N/A'}
                    style={{
                      marginLeft: 8,
                      backgroundColor: getStatusColor(selectedRequest.status),
                      color: 'white',
                      fontWeight: 'bold',
                      textTransform: 'capitalize',
                    }}
                  />
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Typography variant="body1">No request selected</Typography>
          )}
        </div>
      </Drawer>
    </Grid>
  );
};
