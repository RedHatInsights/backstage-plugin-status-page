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
    backgroundColor: '#ccb1f4',
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
  messageContent: {
    whiteSpace: 'pre-wrap',
  },
  feedbackButtonSelection: {
    border: `2px solid ${theme.palette.primary.main}`,
  },
  timeTaken: {
    textAlign: 'right',
    fontSize: theme.typography.pxToRem(12),
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(1),
  },
}));

export default useStyles;
