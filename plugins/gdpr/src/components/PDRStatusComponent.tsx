import { useState, ChangeEvent, FormEvent } from 'react';

interface PDRRecord {
  id: number;
  system: string;
  status: string;
  requestedBy: string;
  requestedDate: string;
  ticketId: string;
}
import {
    TextField,
    Button,
    Grid,

    TableContainer,
    Paper,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Select,
    MenuItem,
    InputLabel,
    FormControl
} from '@material-ui/core';
import { InfoCard } from '@backstage/core-components';

export const PDRStatusComponent = () => {
    // PDR Status form state
    const [pdrForm, setPdrForm] = useState({
        ticketId: '',
        system: 'All',
        status: 'All',
    });

    // Sample records (Initially empty)
    const [records, setRecords] = useState<PDRRecord[]>([]);

    // Handle input changes for PDR Status form
    const updatePdrForm = (event: ChangeEvent<{ name?: string; value: unknown }>) => {
        const { name, value } = event.target;
        setPdrForm({
            ...pdrForm,
            [name as string]: value,
        });
    };

    // Handle search submission (for PDR status)
    const onPdrSearch = (event: FormEvent) => {
        event.preventDefault();
        // PDR Status Search submitted

        // Simulating search results
        setRecords([])
    };

    // Reset PDR form and clear table
    const resetPdrForm = () => {
        setPdrForm({
            ticketId: '',
            system: 'All',
            status: 'All',
        });
        setRecords([]); // Clear table data
    };

    return (
        <Grid container spacing={3} direction="column">
            {/* PDR Status Search Form */}
            <Grid item>
                <InfoCard title="PDR Status Search">
                    <form onSubmit={onPdrSearch}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={4}>
                                <TextField
                                    fullWidth
                                    label="SNow Ticket No."
                                    name="ticketId"
                                    type="text"
                                    variant="outlined"
                                    value={pdrForm.ticketId}
                                    onChange={updatePdrForm}
                                />
                            </Grid>
                            <Grid item xs={4}>
                                <FormControl fullWidth variant="outlined">
                                    <InputLabel>Select a System</InputLabel>
                                    <Select name="system" value={pdrForm.system} onChange={updatePdrForm}>
                                        {['All', 'CP', 'Jira', 'SFDC', 'Qualtrix', 'Zendesk'].map(option => (
                                            <MenuItem key={option} value={option}>{option}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={4}>
                                <FormControl fullWidth variant="outlined">
                                    <InputLabel>Select Status</InputLabel>
                                    <Select name="status" value={pdrForm.status} onChange={updatePdrForm}>
                                        {['All', 'New', 'In-progress', 'Deleted', 'Failed'].map(option => (
                                            <MenuItem key={option} value={option}>{option}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                                <Button variant="contained" color="primary" type="submit">
                                    Search
                                </Button>
                                <Button variant="outlined" color="secondary" onClick={resetPdrForm}>
                                    Reset
                                </Button>
                            </Grid>

                        </Grid>
                    </form>
                </InfoCard>
            </Grid>

            {/* PDR Status Table */}
            <Grid item>
                <InfoCard title={`Total Records Found: ${records.length}`}>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>System</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Requested By</TableCell>
                                    <TableCell>Requested Date</TableCell>
                                    <TableCell>Ticket ID</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {records.length > 0 ? (
                                    records.map(record => (
                                        <TableRow key={record.id}>
                                            <TableCell>{record.id}</TableCell>
                                            <TableCell>{record.system}</TableCell>
                                            <TableCell>{record.status}</TableCell>
                                            <TableCell>{record.requestedBy}</TableCell>
                                            <TableCell>{record.requestedDate}</TableCell>
                                            <TableCell>{record.ticketId}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center">
                                            No records found
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </InfoCard>
            </Grid>
        </Grid>
    );
};
