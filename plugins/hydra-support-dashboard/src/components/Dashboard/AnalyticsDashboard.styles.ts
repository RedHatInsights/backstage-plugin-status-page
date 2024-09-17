import { makeStyles } from '@material-ui/core';

const useStyles = makeStyles(_theme => ({
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: 'auto',
    padding: '2rem'
  },
  card: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: 0,
  },
  jiraSelect: {
    width: '20rem',
    height: '3rem',
  },
  jiraContent: {
    width: '100%',
    height: 'auto',
    border:'grey 0.08rem solid',
    textAlign:'center',
    margin: '0.5rem'
  },
  contentTitle: {
    padding: '0.5rem 0.5rem 0rem 0.5rem',
    fontWeight: 'bold',
    fontSize: '1.2rem',
  }
}));

export default useStyles;
