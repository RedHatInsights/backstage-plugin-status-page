import React from 'react';
import { Chip, Grid } from '@material-ui/core';

interface IProps {
  data: { totalJiras: number; totalStoryPoints: number };
  mode: string;
}

export const StoryPointsChart = (props: IProps) => {
  return (
    <>
      {props.data ? (
        <Grid
          container
          spacing={1}
          style={{ textAlign: 'center', padding: '0.9rem 0' }}
        >
          <Grid item xs={12}>
            <div
              style={{
                fontSize: '2.5rem',
                fontWeight: 'bold',
                color: props.mode === 'dark' ? '#e0f0ff' : '#0066cc',
              }}
            >
              {props.data.totalJiras}
            </div>
            <div>
              <Chip
                label="ISSUE COUNT"
                size="small"
                style={{
                  borderRadius: '0.5rem',
                  margin: '0px',
                  marginBottom: '1rem',
                }}
              />
            </div>
          </Grid>
          <Grid item xs={12}>
            <div
              style={{
                fontSize: '2.5rem',
                fontWeight: 'bold',
                color: props.mode === 'dark' ? '#e0f0ff' : '#0066cc',
              }}
            >
              {props.data.totalStoryPoints}
            </div>
            <div>
              <Chip
                label="STORY POINTS"
                size="small"
                style={{
                  borderRadius: '0.5rem',
                  margin: '0px',
                  marginBottom: '1rem',
                }}
              />
            </div>
          </Grid>
        </Grid>
      ) : (
        ''
      )}
    </>
  );
};
