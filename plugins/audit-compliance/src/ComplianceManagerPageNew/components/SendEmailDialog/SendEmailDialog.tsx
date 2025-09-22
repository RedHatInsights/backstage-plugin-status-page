import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Chip,
  IconButton,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import AddIcon from '@material-ui/icons/Add';
import { useStyles } from './styles';
import { SendEmailDialogProps, EmailFormData } from './types';
import {
  discoveryApiRef,
  fetchApiRef,
  alertApiRef,
  useApi,
} from '@backstage/core-plugin-api';

const DEFAULT_TEMPLATE = `Hi Team,

This is a notification regarding compliance audit for the following applications:

{applications_list}

Please review and take necessary actions.

Best regards,
Compliance Team`;

export const SendEmailDialog = ({
  open,
  onClose,
  applications,
  onEmailSent,
}: SendEmailDialogProps) => {
  const classes = useStyles();
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
  const alertApi = useApi(alertApiRef);

  const [formData, setFormData] = useState<EmailFormData>({
    to: [],
    cc: [],
    subject: 'Compliance Audit Notification',
    body: DEFAULT_TEMPLATE,
  });

  const [newEmail, setNewEmail] = useState('');
  const [sending, setSending] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      const appOwners = applications
        .map(app => app.app_owner)
        .filter((owner, index, arr) => arr.indexOf(owner) === index);

      setFormData({
        to: appOwners,
        cc: [],
        subject: 'Compliance Audit Notification',
        body: DEFAULT_TEMPLATE.replace(
          '{applications_list}',
          applications.map(app => `• ${app.app_name}`).join('\n'),
        ),
      });
    }
  }, [open, applications]);

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const addEmail = (field: 'to' | 'cc') => {
    if (newEmail && isValidEmail(newEmail)) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], newEmail],
      }));
      setNewEmail('');
    }
  };

  const removeEmail = (field: 'to' | 'cc', email: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter(e => e !== email),
    }));
  };

  const handleSendEmail = async () => {
    if (formData.to.length === 0) {
      alertApi.post({
        message: 'Please add at least one recipient',
        severity: 'error',
      });
      return;
    }

    setSending(true);
    try {
      const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
      const response = await fetchApi.fetch(`${baseUrl}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: formData.to.join(','),
          subject: formData.subject,
          html: formData.body.replace(/\n/g, '<br>'),
          replyTo: formData.cc.join(','),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      alertApi.post({
        message: 'Email sent successfully',
        severity: 'success',
      });

      onEmailSent();
      onClose();
    } catch (error) {
      alertApi.post({
        message: 'Failed to send email. Please try again.',
        severity: 'error',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} className={classes.dialog}>
      <DialogTitle className={classes.dialogTitle}>
        Send Email
        <IconButton
          onClick={onClose}
          size="small"
          style={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent className={classes.dialogContent}>
        {/* Recipients */}
        <Box className={classes.section}>
          <Typography className={classes.sectionTitle}>Recipients</Typography>

          <Box mb={2}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              To:
            </Typography>
            <Box display="flex" flexWrap="wrap" mb={1}>
              {formData.to.map(email => (
                <Chip
                  key={email}
                  label={email}
                  onDelete={() => removeEmail('to', email)}
                  className={classes.emailChip}
                  size="small"
                />
              ))}
            </Box>
            <Box display="flex" alignItems="center">
              <TextField
                size="small"
                placeholder="Add email address"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                className={classes.textField}
                onKeyPress={e => e.key === 'Enter' && addEmail('to')}
              />
              <IconButton onClick={() => addEmail('to')} size="small">
                <AddIcon />
              </IconButton>
            </Box>
          </Box>

          <Box>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              CC:
            </Typography>
            <Box display="flex" flexWrap="wrap" mb={1}>
              {formData.cc.map(email => (
                <Chip
                  key={email}
                  label={email}
                  onDelete={() => removeEmail('cc', email)}
                  className={classes.emailChip}
                  size="small"
                />
              ))}
            </Box>
            <Box display="flex" alignItems="center">
              <TextField
                size="small"
                placeholder="Add CC email address"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                className={classes.textField}
                onKeyPress={e => e.key === 'Enter' && addEmail('cc')}
              />
              <IconButton onClick={() => addEmail('cc')} size="small">
                <AddIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>

        {/* Subject */}
        <Box className={classes.section}>
          <Typography className={classes.sectionTitle}>Subject</Typography>
          <TextField
            fullWidth
            value={formData.subject}
            onChange={e =>
              setFormData(prev => ({ ...prev, subject: e.target.value }))
            }
            className={classes.textField}
            variant="outlined"
            size="small"
          />
        </Box>

        {/* Body */}
        <Box className={classes.section}>
          <Typography className={classes.sectionTitle}>Message</Typography>
          <TextField
            fullWidth
            multiline
            rows={8}
            value={formData.body}
            onChange={e =>
              setFormData(prev => ({ ...prev, body: e.target.value }))
            }
            className={classes.textField}
            variant="outlined"
            placeholder="Enter your message here..."
          />
        </Box>
      </DialogContent>

      <DialogActions className={classes.dialogActions}>
        <Button onClick={onClose} className={classes.cancelButton}>
          Cancel
        </Button>
        <Button
          onClick={handleSendEmail}
          variant="contained"
          color="primary"
          className={classes.sendButton}
          disabled={sending}
        >
          {sending ? 'Sending...' : 'Send Email'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
