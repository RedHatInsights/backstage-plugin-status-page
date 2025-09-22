import { makeStyles } from '@material-ui/core/styles';

export const useStyles = makeStyles(theme => ({
  container: {
    padding: theme.spacing(3),
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
  },
  title: {
    fontSize: '20px',
    fontWeight: 600,
    marginBottom: theme.spacing(2),
    color: theme.palette.text.primary,
  },
  subtitle: {
    marginBottom: '16px',
  },
  buttonContainer: {
    display: 'flex',
    gap: theme.spacing(2),
    flexWrap: 'wrap',
  },
  primaryButton: {
    borderRadius: theme.shape.borderRadius,
    padding: '12px 24px',
    fontWeight: 600,
    textTransform: 'none',
    fontSize: '16px',
  },
  secondaryButton: {
    borderRadius: theme.shape.borderRadius,
    padding: '12px 24px',
    fontWeight: 600,
    textTransform: 'none',
    fontSize: '16px',
  },
}));
