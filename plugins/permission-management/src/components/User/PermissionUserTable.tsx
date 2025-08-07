import { useApi } from '@backstage/core-plugin-api';
import { Progress, ResponseErrorPanel } from '@backstage/core-components';
import {
    Chip,
    Table as MuiTable,
    Paper,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
} from '@material-ui/core';
import { useEffect, useState, useCallback } from 'react';
import { permissionManagementApiRef } from '../../api';
import { 
    TableNoRequestsEmptyState,
    TableNoPendingRequestsEmptyState
} from '../Common';

interface AccessRequest {
    id: string;
    userName: string;
    userId: string;
    group: string;
    role: string;
    createdAt: string;
    status: string;
}

export const PermissionUserTable = () => {
    const permissionApi = useApi(permissionManagementApiRef);
    const [requests, setRequests] = useState<AccessRequest[]>([]);
    const [allRequests, setAllRequests] = useState<AccessRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | undefined>(undefined);


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

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(undefined);
            const all = await permissionApi.getAllAccessRequests();
            const pending = all.filter((req: any) => req.status === 'pending');
            setAllRequests(all);
            setRequests(pending);
        } catch (err) {
            const catchError = err as any;
            if (catchError?.status === 204 || catchError?.response?.status === 204) {
                setAllRequests([]);
                setRequests([]);
            } else {
                setError(err as Error);
            }
        } finally {
            setLoading(false);
        }
    }, [permissionApi]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) return <Progress />;
    if (error) return <ResponseErrorPanel error={error} />;

    // Empty state handling is now done inside the table

    return (
        <>
            <Paper style={{ overflowX: 'auto' }}>
                <MuiTable>
                    <TableHead>
                        <TableRow>
                            <TableCell>Username</TableCell>
                            <TableCell>User ID</TableCell>
                            <TableCell>Group</TableCell>
                            <TableCell>Role</TableCell>
                            <TableCell>Created At</TableCell>
                            <TableCell>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {/* Empty state handling inside table */}
                        {(() => {
                            if (allRequests.length === 0) {
                                return <TableNoRequestsEmptyState colSpan={6} onRefresh={fetchData} />;
                            }
                            if (requests.length === 0) {
                                return <TableNoPendingRequestsEmptyState colSpan={6} onRefresh={fetchData} />;
                            }
                            return requests.map(req => (
                                <TableRow key={req.id} hover>
                                    <TableCell>{req.userName}</TableCell>
                                    <TableCell>{req.userId}</TableCell>
                                    <TableCell>{req.group}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={req.role}
                                            style={{
                                                backgroundColor: getRoleColor(req.role),
                                                color: 'white',
                                                textTransform: 'capitalize',
                                                fontWeight: 500,
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>{req.createdAt}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={req.status}
                                            color="default"
                                            style={{
                                                backgroundColor: getStatusColor(req.status),
                                                color: 'white',
                                                textTransform: 'capitalize',
                                                fontWeight: 500,
                                            }}
                                        />
                                    </TableCell>
                                </TableRow>
                            ));
                        })()}
                    </TableBody>
                </MuiTable>
            </Paper>
        </>
    );
};
