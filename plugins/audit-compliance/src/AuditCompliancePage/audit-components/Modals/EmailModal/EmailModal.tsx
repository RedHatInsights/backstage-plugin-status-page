import React, { useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
} from '@material-ui/core';
import { Email } from './SendEmail';
import { EmailModalProps, EmailRef } from './types';

export const EmailModal = ({
  open,
  onClose,
  selectedRows,
  currentUser,
  onEmailSendSuccess,
  app_name,
  frequency,
  period,
}: EmailModalProps) => {
  const emailRef = useRef<EmailRef>(null);

  const handleSendEmails = () => {
    emailRef.current?.sendEmails();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Send Email</DialogTitle>
      <DialogContent>
        <Email
          ref={emailRef}
          selectedRows={selectedRows}
          currentUser={currentUser}
          appName={app_name}
          auditPeriod={period}
          frequency={frequency}
          onEmailSendSuccess={onEmailSendSuccess}
          onClose={onClose}
        />
      </DialogContent>
      <DialogActions>
        <Box width="100%" display="flex" justifyContent="space-between">
          <Button onClick={onClose} variant="outlined" color="default">
            Cancel
          </Button>
          <Button
            onClick={handleSendEmails}
            variant="contained"
            color="primary"
          >
            Send Emails
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default EmailModal;
