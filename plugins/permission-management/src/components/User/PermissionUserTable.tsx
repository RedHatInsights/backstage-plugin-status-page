import {
    Progress,
    ResponseErrorPanel
} from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import {
    Chip,
    Table as MuiTable,
    Paper,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
} from '@material-ui/core';
import { useEffect, useState } from 'react';
import { permissionManagementApiRef } from '../../api';

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

    useEffect(() => {
        const fetchData = async () => {
            try {
                const all = await permissionApi.getAllAccessRequests();
                const pending = all.filter((req: any) => req.status === 'pending');
                setRequests(pending);
            } catch (err) {
                setError(err as Error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [permissionApi]);

    if (loading) return <Progress />;
    if (error) return <ResponseErrorPanel error={error} />;

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
                        {requests.map(req => (
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
                        ))}
                    </TableBody>
                </MuiTable>
            </Paper>
        </>
    );
};
