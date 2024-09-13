import { makeStyles } from '@material-ui/core';

const useStyles = makeStyles((_theme: any) => ({
  legendContainer: {
    display:'flex',
    justifyContent:'space-between',
  },
  legend: {
    padding:'0.5rem',
    fontSize:'1rem',
    fontWeight:'bold',
    width:'33%'
  }
}));

export default useStyles;
