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
    gap: theme.spacing(1),
  },
  button: {
    alignSelf: 'flex-end',
  },
  drawerPaper: {
    width: 400,
    [theme.breakpoints.down('sm')]: {
      width: '100%',
    },
  },
  drawerHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
  },
  drawerContent: {
    padding: theme.spacing(2),
    flex: 1,
    overflow: 'auto',
  },
}));
