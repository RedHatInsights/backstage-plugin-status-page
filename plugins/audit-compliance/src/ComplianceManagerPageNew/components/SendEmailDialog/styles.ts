import { makeStyles } from '@material-ui/core/styles';

export const useStyles = makeStyles(theme => ({
  dialog: {
    '& .MuiDialog-paper': {
      borderRadius: '12px',
      maxWidth: '800px',
      width: '90vw',
    },
  },
  dialogTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#333',
    padding: theme.spacing(3),
    borderBottom: '1px solid #e0e0e0',
  },
  dialogContent: {
    padding: theme.spacing(3),
  },
  section: {
    marginBottom: theme.spacing(3),
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: theme.spacing(1),
    color: '#333',
  },
  formControl: {
    marginBottom: theme.spacing(2),
    width: '100%',
  },
  emailChip: {
    margin: theme.spacing(0.5),
  },
  textField: {
    '& .MuiOutlinedInput-root': {
      borderRadius: '8px',
    },
  },
  dialogActions: {
    padding: theme.spacing(3),
    borderTop: '1px solid #e0e0e0',
    justifyContent: 'space-between',
  },
  cancelButton: {
    borderRadius: '8px',
    textTransform: 'none',
    fontWeight: 500,
  },
  sendButton: {
    borderRadius: '8px',
    textTransform: 'none',
    fontWeight: 600,
    padding: '10px 24px',
  },
}));
