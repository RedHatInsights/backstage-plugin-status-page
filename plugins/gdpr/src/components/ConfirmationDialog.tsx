import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  useTheme,
} from '@material-ui/core';
import { Progress } from '@backstage/core-components';

export interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'secondary' | 'default';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  severity?: 'info' | 'warning' | 'error';
}

/**
 * Reusable confirmation dialog component following Backstage design patterns
 */
export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = 'primary',
  isLoading = false,
  onConfirm,
  onCancel,
  severity = 'warning',
}) => {
  const theme = useTheme();
  
  const getSeverityColor = () => {
    switch (severity) {
      case 'error':
        return theme.palette.error.main;
      case 'warning':
        return theme.palette.warning.main;
      case 'info':
      default:
        return theme.palette.info.main;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onCancel}
      maxWidth="sm"
      fullWidth
      disableBackdropClick={isLoading}
      disableEscapeKeyDown={isLoading}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <Box
            width={4}
            height={24}
            bgcolor={getSeverityColor()}
            borderRadius={2}
          />
          <Box ml={1}>
            <Typography variant="h6" component="span">
              {title}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body1" color="textPrimary">
          {message}
        </Typography>
        
        {isLoading && (
          <Box mt={2} display="flex" alignItems="center">
            <Progress />
            <Box ml={2}>
              <Typography variant="body2" color="textSecondary">
                Processing your request...
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button
          onClick={onCancel}
          color="default"
          disabled={isLoading}
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          color={confirmColor}
          variant="contained"
          disabled={isLoading}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
