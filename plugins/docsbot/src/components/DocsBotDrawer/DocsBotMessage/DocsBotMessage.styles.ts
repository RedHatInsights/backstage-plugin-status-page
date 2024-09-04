import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
  message: {
    display: 'flex',
    marginBottom: theme.spacing(1.25),
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  botMessage: {
    justifyContent: 'flex-start',
  },
  userMessageContainer: {
    backgroundColor: '#aac7ef',
    padding: theme.spacing(2, 3.5),
    borderRadius: theme.shape.borderRadius * 4,
    borderBottomRightRadius: theme.shape.borderRadius * 0.2,
    maxWidth: '80%',
  },
  botMessageContainer: {
    backgroundColor: theme.palette.background.default,
    padding: theme.spacing(2, 3.5),
    borderRadius: theme.shape.borderRadius * 4,
    borderBottomLeftRadius: theme.shape.borderRadius * 0.2,
    maxWidth: '80%',
  },

  feedbackButtonSelection: {
    border: `2px solid ${theme.palette.primary.main}`,
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: theme.spacing(1),
  },
  timeTaken: {
    fontSize: theme.typography.pxToRem(12),
    color: theme.palette.text.secondary,
  },
  feedbackButtons: {
    display: 'flex',
    alignItems: 'center',
  },
  feedbackButton: {
    padding: theme.spacing(0.5),
    minWidth: 0,
    marginLeft: theme.spacing(1),
  },
}));

export default useStyles;
