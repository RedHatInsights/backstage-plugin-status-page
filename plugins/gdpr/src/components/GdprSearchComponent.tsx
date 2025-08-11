// @ts-ignore React is required for JSX in Material-UI v4
import React, { useState } from 'react';
import {
  Table, TableHead, TableRow, TableCell, TableBody,
  TableContainer, Paper, Button, Drawer, Typography,
  Checkbox, Box
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { InfoCard } from '@backstage/core-components';
import CloseIcon from '@material-ui/icons/Close';
import { IconButton } from '@material-ui/core';
import { saveAs } from 'file-saver';
import { gdprApiRef } from '../api';
import { useApi, alertApiRef } from '@backstage/core-plugin-api';
import { GdprTableData, Platform } from '../types';
import { ConfirmationDialog } from './ConfirmationDialog';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import { SkeletonLoader } from './SkeletonLoader';


const useStyles = makeStyles(theme => ({
  actionContainer: {
    display: 'flex',
    gap: theme.spacing(2),
    flexWrap: 'wrap',
    [theme.breakpoints.down('md')]: {
      flexDirection: 'column',
      gap: theme.spacing(1),
      '& button': {
        width: '100%',
      },
    },
  },
  actionButton: {
    marginRight: theme.spacing(1),
    [theme.breakpoints.down('md')]: {
      marginRight: 0,
      minWidth: 'unset',
    },
  },
  drawerPaper: {
    width: 400,
    padding: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
      width: '100%',
      padding: theme.spacing(1),
    },
  },
  drawerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
    paddingBottom: theme.spacing(1),
  },
  drawerTitle: {
    fontWeight: 600,
  },
  userInfoCard: {
    padding: theme.spacing(1.5),
    marginBottom: theme.spacing(1.5),
    backgroundColor: theme.palette.type === 'dark' ? theme.palette.grey[800] : theme.palette.grey[50],
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.divider}`,
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(1),
      marginBottom: theme.spacing(1),
    },
  },
  userInfoLabel: {
    marginBottom: theme.spacing(0.5),
    fontWeight: 500,
  },
  tableActionButton: {
    marginRight: theme.spacing(0.5),
    [theme.breakpoints.down('sm')]: {
      marginRight: theme.spacing(0.25),
      fontSize: '0.75rem',
      padding: theme.spacing(0.5, 1),
    },
  },
  tableContainer: {
    [theme.breakpoints.down('md')]: {
      overflow: 'auto',
      '& .MuiTable-root': {
        minWidth: 650,
      },
    },
  },
  mobileHideColumn: {
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
  mobileStackActions: {
    [theme.breakpoints.down('sm')]: {
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(0.5),
      '& button': {
        fontSize: '0.7rem',
        padding: theme.spacing(0.25, 0.5),
      },
    },
  },
}));

interface GdprSearchComponentProps {
  searchType: string;
  searchResults: GdprTableData[];
  onSearchResultsChange?: (results: GdprTableData[]) => void;
  isLoading?: boolean;
}

export const GdprSearchComponent = ({ searchType, searchResults, onSearchResultsChange, isLoading = false }: GdprSearchComponentProps) => {
  const classes = useStyles();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<GdprTableData | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<boolean[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const gdprApi = useApi(gdprApiRef);
  const alertApi = useApi(alertApiRef);
  
  // Confirmation dialog state
  const {
    dialogState,
    isLoading: dialogLoading,
    showConfirmDialog,
    handleConfirm,
    handleCancel,
  } = useConfirmDialog();

  const handleViewUser = (user: GdprTableData) => {
    setSelectedUser(user);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedUser(null);
  };

  const handleDeleteUser = (username: string, platform: Platform) => {
    showConfirmDialog({
      title: 'Delete User Data',
      message: `Are you sure you want to permanently delete all GDPR data for user "${username}" from ${platform.toUpperCase()}? This action cannot be undone.`,
      confirmText: 'Delete Data',
      confirmColor: 'secondary',
      severity: 'error',
      onConfirm: async () => {
        try {
          const response = await gdprApi.deleteDrupalGDPRData([{ uid: username, platform }]);

          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const filename = `Deleted_Drupal_GDPR_${timestamp}.json`;
          const blob = new Blob([JSON.stringify(response, null, 2)], {
            type: 'application/json',
          });
          saveAs(blob, filename);
          
          alertApi.post({
            message: `User ${username} deleted successfully.`,
            severity: 'success',
          });
        } catch (error) {
          alertApi.post({
            message: `Failed to delete user ${username}.`,
            severity: 'error',
          });
        }
      },
    });
  };




  const handleBulkDeleteUser = () => {
    const selectedData = searchResults.filter((_, index) => selectedUsers[index]);

    if (selectedData.length === 0) {
      alertApi.post({
        message: "No users selected for deletion.",
        severity: 'warning',
      });
      return;
    }

    showConfirmDialog({
      title: 'Bulk Delete User Data',
      message: `Are you sure you want to permanently delete GDPR data for ${selectedData.length} selected users? This action cannot be undone and will affect multiple user records.`,
      confirmText: `Delete ${selectedData.length} Users`,
      confirmColor: 'secondary',
      severity: 'error',
      onConfirm: async () => {
        try {
          const payload = [];
          for (const data of selectedData) {
            if (data.uid) {
              payload.push({ uid: data.uid, platform: data.platform });
            }
          }
          
          const response = await gdprApi.deleteDrupalGDPRData(payload);
          
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const filename = `Deleted_Drupal_GDPR_${timestamp}.json`;
          const blob = new Blob([JSON.stringify(response, null, 2)], {
            type: 'application/json',
          });
          saveAs(blob, filename);
          
          alertApi.post({
            message: `${selectedData.length} users deleted successfully.`,
            severity: 'success',
          });
          
          // Clear search results through callback
          if (onSearchResultsChange) {
            onSearchResultsChange([]);
          }
          
          // Reset selections
          setSelectedUsers([]);
          setSelectAll(false);
        } catch (error) {
          alertApi.post({
            message: "Failed to delete selected users.",
            severity: 'error',
          });
        }
      },
    });
  };

  const toggleUserSelection = (index: number) => {
    const updated = [...selectedUsers];
    updated[index] = !updated[index];
    setSelectedUsers(updated);
  };

  const handleSelectAll = () => {
    const allSelected = !selectAll;
    setSelectAll(allSelected);
    const updatedSelection = searchResults.map(() => allSelected);
    setSelectedUsers(updatedSelection);
  };


  const bulkDownloadUserData = async () => {
    const selectedData = searchResults.filter((_, index) => selectedUsers[index]);

    if (selectedData.length === 0) {
      alertApi.post({
        message: "No users selected for download.",
        severity: 'warning',
      });
      return;
    }

    setIsDownloading(true);
    try {
      alertApi.post({
        message: `Preparing download for ${selectedData.length} users...`,
        severity: 'info',
      });

      // Simulate processing time for large datasets
      if (selectedData.length > 10) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `Drupal_GDPR_${timestamp}.json`;

      // Create enhanced download data with metadata
      const downloadData = {
        metadata: {
          exportDate: new Date().toISOString(),
          recordCount: selectedData.length,
          searchType: searchType,
          version: '1.0'
        },
        data: selectedData
      };

      const blob = new Blob([JSON.stringify(downloadData, null, 2)], {
        type: 'application/json',
      });

      saveAs(blob, filename);
      
      alertApi.post({
        message: `Successfully downloaded ${selectedData.length} user records`,
        severity: 'success',
      });

    } catch (error) {
      alertApi.post({
        message: "Failed to download user data. Please try again.",
        severity: 'error',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return <SkeletonLoader variant="table" rows={8} />;
  }

  return (
    <>
      <InfoCard
        title={`Total Records Found: ${searchResults.length}`}
        action={
          <Box className={classes.actionContainer}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleSelectAll}
              className={classes.actionButton}
            >
              {selectAll ? 'Deselect All' : 'Select All'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              disabled={!selectedUsers.some(Boolean) || isDownloading}
              onClick={bulkDownloadUserData}
              className={classes.actionButton}
            >
              {isDownloading ? 'Downloading...' : 'Download Selected'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              disabled={!selectedUsers.some(Boolean)}
              onClick={handleBulkDeleteUser}
              className={classes.actionButton}
            >
              Delete Selected
            </Button>
          </Box>
        }
      >
        <TableContainer component={Paper} className={classes.tableContainer}>
          <Table>
            <TableHead>
              <TableRow>
                {searchType !== "All System" && <TableCell padding="checkbox"><Checkbox checked={selectAll} onChange={handleSelectAll} /></TableCell>}
                {searchType === "All System" ? (
                  <>
                    <TableCell>ID</TableCell>
                    <TableCell>System</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Requested By</TableCell>
                    <TableCell>Requested Date</TableCell>
                    <TableCell>Ticket ID</TableCell>
                  </>
                ) : (
                  <>
                    <TableCell>Platform</TableCell>
                    <TableCell>Username</TableCell>
                    <TableCell>SSO ID</TableCell>
                    <TableCell>Roles</TableCell>
                    <TableCell className={classes.mobileHideColumn}>Comment</TableCell>
                    <TableCell className={classes.mobileHideColumn}>File</TableCell>
                    <TableCell className={classes.mobileHideColumn}>Node</TableCell>
                    <TableCell className={classes.mobileHideColumn}>RH Learn ID</TableCell>
                    <TableCell className={classes.mobileHideColumn}>Media</TableCell>
                    <TableCell>Actions</TableCell>
                  </>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {searchResults.length > 0 ? (
                searchResults.map((row, index) => (
                  <TableRow key={index}>
                    {searchType !== "All System" && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={!!selectedUsers[index]}
                          onChange={() => toggleUserSelection(index)}
                        />
                      </TableCell>
                    )}
                    {searchType === "All System" ? (
                      <>
                        <TableCell>{(row as any).id || 'N/A'}</TableCell>
                        <TableCell>{(row as any).system || 'N/A'}</TableCell>
                        <TableCell>{(row as any).status || 'N/A'}</TableCell>
                        <TableCell>{(row as any).requestedBy || 'N/A'}</TableCell>
                        <TableCell>{(row as any).requestedDate || 'N/A'}</TableCell>
                        <TableCell>{(row as any).ticketId || 'N/A'}</TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>{row.platform}</TableCell>
                        <TableCell>{row.username}</TableCell>
                        <TableCell>{row.ssoId}</TableCell>
                        <TableCell>{row.roles}</TableCell>
                        <TableCell className={classes.mobileHideColumn}>{row.comment}</TableCell>
                        <TableCell className={classes.mobileHideColumn}>{row.file}</TableCell>
                        <TableCell className={classes.mobileHideColumn}>{row.node}</TableCell>
                        <TableCell className={classes.mobileHideColumn}>{row.rhlearnId}</TableCell>
                        <TableCell className={classes.mobileHideColumn}>{row.media}</TableCell>
                        <TableCell>
                          <Box className={classes.mobileStackActions}>
                            <Button
                              variant="contained"
                              color="primary"
                              size="small"
                              className={classes.tableActionButton}
                              onClick={() => handleViewUser(row)}
                            >
                              View User
                            </Button>
                            <Button
                              variant="outlined"
                              color="secondary"
                              size="small"
                              className={classes.tableActionButton}
                              onClick={() => handleDeleteUser(row.uid || '', row.platform)}
                            >
                              Delete User
                            </Button>
                          </Box>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={searchType === "All System" ? 6 : 11} align="center">
                    No results found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </InfoCard>

      {/* Drawer with user details stays unchanged */}
      <Drawer anchor="right" open={drawerOpen} onClose={closeDrawer}>
        <Box width={400} display="flex" flexDirection="column" height="100%">
          <Box
            p={2}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            borderBottom="1px solid #e0e0e0"
            position="sticky"
            top={0}
            bgcolor="background.paper"
            zIndex={1}
          >
            <Typography variant="h6" style={{ fontWeight: 600 }}>
              User Details
            </Typography>
            <IconButton onClick={closeDrawer} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          <Box p={2} overflow="auto">
            {selectedUser ? (
              Object.entries(selectedUser).map(([key, value], index) => (
                <Paper
                  key={index}
                  elevation={2}
                  className={classes.userInfoCard}
                >
                  <Typography
                    variant="subtitle2"
                    color="textSecondary"
                    className={classes.userInfoLabel}
                  >
                    {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^./, str => str.toUpperCase())}
                  </Typography>
                  <Typography variant="body2">{String(value) || 'N/A'}</Typography>
                </Paper>
              ))
            ) : (
              <Typography>No user selected</Typography>
            )}
          </Box>
        </Box>
      </Drawer>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={dialogState.open}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        confirmColor={dialogState.confirmColor}
        severity={dialogState.severity}
        isLoading={dialogLoading}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  );
};
