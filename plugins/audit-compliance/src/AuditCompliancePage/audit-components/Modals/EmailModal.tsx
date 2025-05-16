import React, { useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
} from '@material-ui/core';
import Email, { EmailRef } from '../SendEmail';

interface EmailModalProps {
  open: boolean;
  onClose: () => void;
  selectedRows: any[];
  currentUser: string;
  onEmailSendSuccess: () => void;
}

export const EmailModal = ({
  open,
  onClose,
  selectedRows,
  currentUser,
  onEmailSendSuccess,
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
          appName="Hydra"
          auditPeriod="quarterly Q2 review"
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
