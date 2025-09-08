import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  OutlinedInput,
  Checkbox,
  ListItemText,
  IconButton,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import { useStyles, MenuProps } from './styles';
import { Application, InitiateAuditDialogProps } from './types';

export const InitiateAuditDialog: React.FC<InitiateAuditDialogProps> = ({
  open,
  onClose,
  applications,
  selectedApplications,
  frequency,
  selectedQuarter,
  selectedYear,
  onFrequencyChange,
  onQuarterChange,
  onYearChange,
  onApplicationsChange,
  onInitiate,
  initiating,
  getQuarterOptions,
  getYearOptions,
}) => {
  const classes = useStyles();
  const [localSelectedApplications, setLocalSelectedApplications] =
    useState<string[]>(selectedApplications);

  // Sync local state with props when dialog opens
  useEffect(() => {
    if (open) {
      setLocalSelectedApplications(selectedApplications);
    }
  }, [open, selectedApplications]);

  const handleApplicationsChange = (
    event: React.ChangeEvent<{ value: unknown }>,
  ) => {
    const value = event.target.value as string[];
    setLocalSelectedApplications(value);
    onApplicationsChange(value);
  };

  const handleRemoveApplication = (applicationIdToRemove: string) => {
    const updatedSelection = localSelectedApplications.filter(
      id => id !== applicationIdToRemove,
    );
    setLocalSelectedApplications(updatedSelection);
    onApplicationsChange(updatedSelection);
  };

  const handleClearAllApplications = () => {
    setLocalSelectedApplications([]);
    onApplicationsChange([]);
  };

  const getSelectedApplicationDetails = () => {
    return applications.filter(app =>
      localSelectedApplications.includes(app.id),
    );
  };

  const getPeriodDisplay = () => {
    if (frequency === 'quarterly') {
      return `${selectedQuarter} ${selectedYear}`;
    } else if (frequency === 'yearly') {
      return selectedYear.toString();
    }
    return 'Not specified';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Initiate Bulk Audit</DialogTitle>
      <DialogContent>
        <Box mt={2}>
          <Typography variant="h6" gutterBottom>
            Audit Configuration
          </Typography>

          <Grid container spacing={3}>
            {/* Applications Multi-Select */}
            <Grid item xs={12}>
              <Box>
                <Box display="flex" alignItems="center" mb={1}>
                  <Typography variant="subtitle2" color="textSecondary">
                    {localSelectedApplications.length} application(s) selected
                  </Typography>
                  {localSelectedApplications.length > 0 && (
                    <Chip
                      size="small"
                      label={`${localSelectedApplications.length} selected`}
                      color="primary"
                      variant="outlined"
                    />
                  )}
                </Box>
                <Box display="flex" alignItems="center">
                  <FormControl fullWidth>
                    <InputLabel>Select Applications</InputLabel>
                    <Select
                      multiple
                      value={localSelectedApplications}
                      onChange={handleApplicationsChange}
                      input={<OutlinedInput label="Select Applications" />}
                      renderValue={selected => (
                        <Box display="flex" flexWrap="wrap">
                          {(selected as string[]).map(value => {
                            const app = applications.find(a => a.id === value);
                            return (
                              <Chip
                                key={value}
                                label={app?.app_name || value}
                                size="small"
                                onDelete={() => handleRemoveApplication(value)}
                                deleteIcon={
                                  <IconButton
                                    size="small"
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleRemoveApplication(value);
                                    }}
                                  >
                                    <CloseIcon fontSize="small" />
                                  </IconButton>
                                }
                              />
                            );
                          })}
                        </Box>
                      )}
                      MenuProps={MenuProps}
                    >
                      {applications.map(app => (
                        <MenuItem key={app.id} value={app.id}>
                          <Checkbox
                            checked={
                              localSelectedApplications.indexOf(app.id) > -1
                            }
                          />
                          <ListItemText
                            primary={app.app_name}
                            secondary={`${app.app_owner} | ${app.cmdb_id}`}
                          />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            </Grid>

            {/* Audit Frequency */}
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth required>
                <InputLabel required>Audit Frequency</InputLabel>
                <Select
                  value={frequency}
                  onChange={e =>
                    onFrequencyChange(e.target.value as 'quarterly' | 'yearly')
                  }
                  required
                >
                  <MenuItem value="quarterly">Quarterly</MenuItem>
                  <MenuItem value="yearly">Yearly</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Quarter Selection */}
            {frequency === 'quarterly' && (
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth required>
                  <InputLabel required>Select Quarter</InputLabel>
                  <Select
                    value={selectedQuarter}
                    onChange={e => onQuarterChange(e.target.value as string)}
                    required
                  >
                    {getQuarterOptions().map(q => (
                      <MenuItem key={q.value} value={q.value}>
                        {q.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {/* Year Selection */}
            {(frequency === 'yearly' || frequency === 'quarterly') && (
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth required>
                  <InputLabel required>Select Year</InputLabel>
                  <Select
                    value={selectedYear}
                    onChange={e => onYearChange(Number(e.target.value))}
                    required
                  >
                    {getYearOptions().map(year => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>

          {/* Review Table */}
          {localSelectedApplications.length > 0 && (
            <Box mt={4}>
              <Typography variant="h6" gutterBottom>
                Review Selected Applications
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Application Name</TableCell>
                      <TableCell>Owner</TableCell>
                      <TableCell>CMDB ID</TableCell>
                      <TableCell>Audit Period</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getSelectedApplicationDetails().map(app => (
                      <TableRow key={app.id}>
                        <TableCell>
                          <Typography
                            variant="body2"
                            style={{ fontWeight: 500 }}
                          >
                            {app.app_name}
                          </Typography>
                        </TableCell>
                        <TableCell>{app.app_owner}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={app.cmdb_id}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={getPeriodDisplay()}
                            color="primary"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label="Pending"
                            style={{
                              backgroundColor: '#E3F2FD',
                              color: '#1565C0',
                              borderColor: '#42A5F5',
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="secondary"
                            onClick={() => handleRemoveApplication(app.id)}
                            title="Remove application"
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box mt={2}>
                <Typography variant="body2" color="textSecondary">
                  Total applications to audit:{' '}
                  <strong>{localSelectedApplications.length}</strong>
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Audit period: <strong>{getPeriodDisplay()}</strong>
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          color="primary"
          onClick={onInitiate}
          disabled={
            initiating ||
            localSelectedApplications.length === 0 ||
            !frequency ||
            (frequency === 'quarterly' && !selectedQuarter)
          }
        >
          {initiating
            ? 'Initiating Bulk Audits...'
            : `Initiate ${localSelectedApplications.length} Audit(s)`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
