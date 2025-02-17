import { makeStyles } from '@material-ui/core';

const useStyles = makeStyles(_theme => ({
  content: {
    display: 'flex',
    flexDirection: 'column',
    height: 'auto',
    padding: '2rem',
    width: 'fit-content',
    borderRadius: '0.15rem',
  },
  pluginTitle: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
  },
  value: {
    fontSize: '2rem',
    textAlign: 'center',
  },
  dataPointName: {
    color: '#0066cc',
    textAlign: 'center',
  },
  typoGraphy: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  infoCard: {
    marginBottom: '1rem'
  }
}));

export default useStyles;
