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
    fontSize: '24px',
    fontWeight: 600,
    color: '#333',
    padding: theme.spacing(3),
    borderBottom: '1px solid #e0e0e0',
  },
  closeButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
  },
  dialogContent: {
    padding: theme.spacing(3),
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: theme.spacing(2),
    color: '#333',
  },
  formControl: {
    marginBottom: theme.spacing(2),
    minWidth: 200,
  },
  applicationsTable: {
    marginTop: theme.spacing(2),
    borderRadius: '8px',
    overflow: 'hidden',
  },
  tableHeader: {
    backgroundColor: '#f8f9fa',
  },
  tableHeaderCell: {
    fontWeight: 600,
    fontSize: '14px',
    color: '#333',
  },
  tableRow: {
    '&:hover': {
      backgroundColor: '#f8f9fa',
    },
  },
  appName: {
    fontWeight: 500,
    color: '#333',
  },
  appOwner: {
    fontSize: '12px',
    color: '#666',
  },
  selectedChip: {
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    fontWeight: 500,
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
  initiateButton: {
    borderRadius: '8px',
    textTransform: 'none',
    fontWeight: 600,
    padding: '10px 24px',
  },
  selectedCount: {
    fontSize: '14px',
    color: '#666',
    fontWeight: 500,
  },
}));

export const ITEM_HEIGHT = 48;
export const ITEM_PADDING_TOP = 8;
export const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};
