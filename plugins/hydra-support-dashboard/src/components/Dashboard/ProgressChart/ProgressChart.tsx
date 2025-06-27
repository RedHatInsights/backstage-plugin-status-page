import { useEffect, useState } from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import {
  Chip,
  Grid,
  LinearProgress,
  LinearProgressProps,
} from '@material-ui/core';

interface IProps {
  progressData: any;
}

export const ProgressChart = (props: IProps) => {
  const [totalJiras, setTotalJiras] = useState(0);

  useEffect(() => {
    if (props.progressData && Object.keys(props.progressData).length) {
      let total = 0;
      Object.keys(props.progressData).forEach(status => {
        total += props.progressData[status];
      });
      setTotalJiras(total);
    }
  }, [props.progressData]);

  const LinearProgressWithLabel = (
    event: LinearProgressProps & { value: number },
  ) => {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{ width: '100%', mr: 1 }}>
          <LinearProgress variant="determinate" value={event.value} />
        </Box>
        <Box sx={{ minWidth: 35 }}>
          <Typography
            variant="body2"
            sx={{ color: 'text.secondary' }}
          >{`${Math.round(event.value)}%`}</Typography>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      {props.progressData && Object.keys(props.progressData) && totalJiras ? (
        <>
          <div
            style={{ padding: '0.2rem', borderBottom: '0.1rem solid #c7c7c7' }}
          >
            <Grid
              container
              spacing={2}
              style={{ fontWeight: '500', padding: '0.5rem 0.3rem' }}
            >
              <Grid item xs={4} style={{ textAlign: 'left' }}>
                Status
              </Grid>
              <Grid item xs={8}>
                Issues progress
              </Grid>
            </Grid>
          </div>
          {Object.keys(props.progressData).map(status => {
            return (
              <div style={{ padding: '0.35rem' }}>
                <Grid container spacing={2}>
                  <Grid item xs={5} style={{ textAlign: 'left' }}>
                    <Chip
                      label={status?.toLocaleUpperCase()}
                      size="small"
                      style={{ borderRadius: '0.5rem', margin: '0px' }}
                    />
                  </Grid>
                  <Grid item xs={1}>
                    {props.progressData[status]}
                  </Grid>
                  <Grid item xs={6}>
                    <LinearProgressWithLabel
                      value={(props.progressData[status] / totalJiras) * 100}
                    />
                  </Grid>
                </Grid>
              </div>
            );
          })}
          <div style={{ padding: '0.2rem' }}>
            <Grid container spacing={2}>
              <Grid item xs={3} style={{ textAlign: 'left' }}>
                Total
              </Grid>
              <Grid item xs={1}>
                {totalJiras}
              </Grid>
              <Grid item xs={8}>
                <LinearProgressWithLabel value={100} />
              </Grid>
            </Grid>
          </div>
        </>
      ) : (
        ''
      )}
    </Box>
  );
};
