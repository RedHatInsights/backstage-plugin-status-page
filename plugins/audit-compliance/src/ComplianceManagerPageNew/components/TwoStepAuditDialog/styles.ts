import { makeStyles } from '@material-ui/core/styles';

export const useStyles = makeStyles(theme => ({
  dialogTitle: {
    padding: theme.spacing(3),
    borderBottom: '1px solid #e0e0e0',
    fontSize: '20px',
    fontWeight: 600,
    color: '#333',
  },
  dialogContent: {
    padding: theme.spacing(3),
  },
  sectionTitle: {
    marginBottom: theme.spacing(2),
    fontWeight: 600,
    fontSize: '18px',
    color: '#333',
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
    borderTop: '1px solid #e0e0e0',
    justifyContent: 'space-between',
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
