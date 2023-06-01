import React from 'react';
import { Grid } from '@material-ui/core';
import Skeleton from '@material-ui/lab/Skeleton';

export const CardSkeleton = () => (
  <Grid container>
    <Grid item xs={12}>
      <Skeleton animation="wave" height={16} />
      <Skeleton animation="wave" height={32} />
    </Grid>
    <Grid item md={4} xs={12}>
      <Skeleton animation="wave" height={16} />
      <Skeleton animation="wave" height={32} />
    </Grid>
    <Grid item md={4} xs={12}>
      <Skeleton animation="wave" height={16} />
      <Skeleton animation="wave" height={32} />
    </Grid>
    <Grid item md={4} xs={12}>
      <Skeleton animation="wave" height={16} />
      <Skeleton animation="wave" height={32} />
    </Grid>
    <Grid item md={6} xs={12}>
      <Skeleton animation="wave" height={16} />
      <Skeleton animation="wave" height={32} />
    </Grid>
    <Grid item md={6} xs={12}>
      <Skeleton animation="wave" height={16} />
      <Skeleton animation="wave" height={32} />
    </Grid>
    <Grid item xs={12}>
      <Skeleton animation="wave" height={16} />
      <Skeleton animation="wave" height={48} />
    </Grid>
  </Grid>
);
