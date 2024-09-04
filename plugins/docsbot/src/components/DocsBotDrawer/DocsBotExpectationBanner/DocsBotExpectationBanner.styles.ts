import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
  modalContent: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '60%', // Increased width
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[5],
    padding: theme.spacing(4),
    outline: 'none',
    borderRadius: '8px', // Rounded corners for a more modern look
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(3), // Added more space
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: '1.5rem', // Slightly larger title
    color: '#1F5493',
  },
  modalText: {
    marginBottom: theme.spacing(2),
    fontSize: '1rem',
    lineHeight: '1.6',
  },
  importantText: {
    fontWeight: 'bold', // Bold for emphasis
  },
  list: {
    paddingLeft: theme.spacing(3),
    marginBottom: theme.spacing(2),
    '& li': {
      marginBottom: theme.spacing(1), // Spacing between list items
    },
  },
  proTip: {
    fontStyle: 'italic',
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(2),
  },
  closeButton: {
    padding: theme.spacing(0.5),
  },
}));

export default useStyles;
