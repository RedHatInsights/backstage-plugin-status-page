import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
  modalContent: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '60%',
    maxHeight: '80vh',
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[5],
    padding: theme.spacing(4),
    outline: 'none',
    borderRadius: '8px',
    overflowY: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
    position: 'relative',
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: '1.5rem',
    color: '#1F5493',
  },
  modalText: {
    marginBottom: theme.spacing(2),
    fontSize: '1rem',
    lineHeight: '1.6',
  },
  importantText: {
    fontWeight: 'bold',
  },
  list: {
    paddingLeft: theme.spacing(3),
    marginBottom: theme.spacing(2),
    '& li': {
      marginBottom: theme.spacing(1),
    },
  },
  proTip: {
    fontStyle: 'italic',
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(2),
  },
  closeButton: {
    padding: theme.spacing(0.5),
    position: 'absolute',
    top: theme.spacing(1),
    right: theme.spacing(1),
    zIndex: 1,
  },
}));

export default useStyles;
