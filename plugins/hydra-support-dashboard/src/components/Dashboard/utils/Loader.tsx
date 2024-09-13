import * as React from 'react';
import { LinearProgress, Box, CircularProgress } from '@material-ui/core';

interface IProps {
  message: string;
}
export const Loader = (props: IProps) => {
  return (
    <>
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
      </Box>
      <Box sx={{ display: 'flex', marginTop: '1rem' }}>
        <div
          style={{
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '1rem',
            textAlign: 'center',
          }}
        >
          <CircularProgress size={20} thickness={4} /> &nbsp; {props.message}...
        </div>
      </Box>
    </>
  );
};
