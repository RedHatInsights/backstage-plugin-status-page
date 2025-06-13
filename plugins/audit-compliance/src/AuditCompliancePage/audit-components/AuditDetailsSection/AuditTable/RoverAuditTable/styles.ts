import { makeStyles } from '@material-ui/core/styles';

export const useStyles = makeStyles(() => ({
  sourceChip: {
    textTransform: 'capitalize',
    padding: '0 8px',
    height: '24px',
    minHeight: '24px',
    fontSize: '0.75rem',
    '& .MuiChip-label': {
      padding: '0 8px',
      fontSize: '0.75rem',
    },
    '& .MuiChip-icon': {
      marginLeft: '4px',
      marginRight: '-4px',
      fontSize: '1rem',
    },
  },
}));
