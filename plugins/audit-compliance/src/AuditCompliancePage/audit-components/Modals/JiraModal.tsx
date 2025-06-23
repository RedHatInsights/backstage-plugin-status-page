import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Snackbar,
  Box,
  CircularProgress,
} from '@material-ui/core';
import { Alert } from '@material-ui/lab'; // <-- MUI v4 Alert

interface JiraModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (ticketType: string, description: string, comments: string) => void;
  initialDescription: string;
  initialTitle?: string;
  loading?: boolean;
}

const JiraModal: React.FC<JiraModalProps> = ({
  open,
  onClose,
  onSubmit,
  initialDescription,
  initialTitle,
  loading = false,
}) => {
  const [ticketType, setTicketType] = useState('task');
  const [jiraDescription, setJiraDescription] = useState(initialDescription);
  const [comments, setComments] = useState('');
  const [showSnackbar, setShowSnackbar] = useState(false);

  // Update description when initialDescription changes
  useEffect(() => {
    setJiraDescription(initialDescription);
  }, [initialDescription]);

  const handleSubmit = () => {
    if (!jiraDescription) {
      setShowSnackbar(true);
      return;
    }

    onSubmit(ticketType, jiraDescription, comments);
    onClose();
    setTicketType('task');
    setJiraDescription('');
    setComments('');
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Create Jira Ticket</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" mt={2}>
            {initialTitle && (
              <TextField
                label="Jira Ticket Title"
                value={initialTitle}
                fullWidth
                disabled
                variant="outlined"
                size="small"
                margin="normal"
                InputProps={{
                  readOnly: true,
                }}
              />
            )}
            <TextField
              label="Description"
              value={jiraDescription}
              onChange={e => setJiraDescription(e.target.value)}
              multiline
              rows={4}
              fullWidth
              variant="outlined"
              size="small"
              margin="normal"
            />
            <TextField
              label="Comments"
              value={comments}
              onChange={e => setComments(e.target.value)}
              multiline
              rows={4}
              fullWidth
              variant="outlined"
              size="small"
              margin="normal"
              placeholder="Add any additional comments here..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="primary" disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            color="primary"
            variant="contained"
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Create Ticket'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={showSnackbar}
        autoHideDuration={3000}
        onClose={() => setShowSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="warning" onClose={() => setShowSnackbar(false)}>
          Please enter a Jira description.
        </Alert>
      </Snackbar>
    </>
  );
};

export default JiraModal;
