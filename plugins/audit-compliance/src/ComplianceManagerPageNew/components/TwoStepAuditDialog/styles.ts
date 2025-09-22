import { makeStyles } from '@material-ui/core/styles';

export const useStyles = makeStyles(theme => ({
  dialogTitle: {
    padding: theme.spacing(3),
    borderBottom: `1px solid ${theme.palette.divider}`,
    fontSize: '20px',
    fontWeight: 600,
    color: theme.palette.text.primary,
  },
  dialogContent: {
    padding: theme.spacing(3),
  },
  sectionTitle: {
    marginBottom: theme.spacing(2),
    fontWeight: 600,
    fontSize: '18px',
    color: theme.palette.text.primary,
  },
  formControl: {
    margin: theme.spacing(1, 0),
    minWidth: 120,
    maxWidth: 300,
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  chip: {
    margin: 2,
  },
  emailChip: {
    margin: theme.spacing(0.5),
  },
  dialogActions: {
    padding: theme.spacing(2, 3),
    borderTop: `1px solid ${theme.palette.divider}`,
    justifyContent: 'space-between',
  },
  errorBox: {
    backgroundColor: theme.palette.error.light,
    color: theme.palette.error.dark,
    padding: theme.spacing(1.5),
    borderRadius: theme.shape.borderRadius,
    marginBottom: theme.spacing(2),
    border: `1px solid ${theme.palette.error.main}`,
  },
  editButton: {
    backgroundColor: theme.palette.action.hover,
    color: theme.palette.text.secondary,
    '&:hover': {
      backgroundColor: theme.palette.action.selected,
    },
  },
  editButtonActive: {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.main,
    '&:hover': {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
    },
  },
  emailPreview: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(2.5),
    minHeight: '300px',
    backgroundColor: theme.palette.background.paper,
    overflow: 'auto',
    position: 'relative',
    '& table': {
      '--border-color': theme.palette.divider,
      '--table-header-bg': theme.palette.action.hover,
      '--table-row-even-bg': theme.palette.background.paper,
      '--table-row-odd-bg': theme.palette.action.hover,
      '--text-primary': theme.palette.text.primary,
      '--text-secondary': theme.palette.text.secondary,
      '--link-color': theme.palette.primary.main,
    },
  },
  emailPreviewContent: {
    fontFamily: 'Arial, sans-serif',
    lineHeight: '1.6',
    color: theme.palette.text.primary,
  },
  emailPreviewPlaceholder: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    color: theme.palette.text.disabled,
    fontSize: '14px',
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
