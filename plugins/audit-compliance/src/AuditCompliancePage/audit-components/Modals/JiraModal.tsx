import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Snackbar,
} from '@material-ui/core';
import { Alert } from '@material-ui/lab'; // <-- MUI v4 Alert

interface JiraModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    ticketType: string,
    jiraDescription: string,
    comments: string,
  ) => void;
}

const JiraModal: React.FC<JiraModalProps> = ({ open, onClose, onSubmit }) => {
  const [ticketType, setTicketType] = useState('JIRA');
  const [jiraDescription, setJiraDescription] = useState('');
  const [comments, setComments] = useState('');
  const [showSnackbar, setShowSnackbar] = useState(false);

  const handleSubmit = () => {
    if (!jiraDescription) {
      setShowSnackbar(true);
      return;
    }

    onSubmit(ticketType, jiraDescription, comments);
    setTicketType('JIRA');
    setJiraDescription('');
    setComments('');
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>Reject Entry</DialogTitle>
        <DialogContent>
          <TextField
            label="Ticket Type"
            value={ticketType}
            onChange={e => setTicketType(e.target.value)}
            select
            fullWidth
            margin="normal"
          >
            <MenuItem value="JIRA">JIRA</MenuItem>
            <MenuItem value="SNOW">SNOW</MenuItem>
          </TextField>

          <TextField
            label="Jira Ticket Description"
            value={jiraDescription}
            onChange={e => setJiraDescription(e.target.value)}
            multiline
            rows={4}
            variant="outlined"
            fullWidth
            margin="normal"
          />

          <TextField
            label="Reviewer Comments"
            value={comments}
            onChange={e => setComments(e.target.value)}
            multiline
            rows={3}
            variant="outlined"
            fullWidth
            margin="normal"
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} color="default">
            Cancel
          </Button>
          <Button onClick={handleSubmit} color="secondary" variant="contained">
            Submit
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
