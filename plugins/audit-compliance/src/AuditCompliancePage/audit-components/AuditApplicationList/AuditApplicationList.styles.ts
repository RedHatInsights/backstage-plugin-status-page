import { makeStyles } from '@material-ui/core/styles';

export const useStyles = makeStyles(theme => ({
  card: {
    height: '200px',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f9f9f9',
    boxShadow: '0 4px 8px rgba(0,0,0,0.05)',
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: theme.spacing(2),
  },
  cardTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  cardTitle: {
    fontWeight: 600,
    fontSize: '1.2rem',
    flexGrow: 1,
  },
  cardText: {
    fontSize: '0.9rem',
    color: '#555',
  },
  chip: {
    marginTop: theme.spacing(1),
    backgroundColor: '#ffe0e0',
    color: '#d32f2f',
    fontWeight: 600,
    width: 'fit-content',
  },
  spacer: {
    flexGrow: 1,
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  button: {
    alignSelf: 'flex-end',
  },
}));
