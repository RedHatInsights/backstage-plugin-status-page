import React from 'react';
import { Card, CardContent, Grid, Typography, Box } from '@material-ui/core';
import { useStyles } from './styles';
import { SummaryCardsNewProps } from './types';

export const SummaryCardsNew: React.FC<SummaryCardsNewProps> = ({
  summary,
}) => {
  const classes = useStyles();

  return (
    <Box>
      <Grid container spacing={4} justifyContent="center">
        <Grid item xs={12} sm={6} md={4}>
          <Card className={classes.card}>
            <CardContent className={classes.cardContent}>
              <Typography className={classes.label}>
                Total Applications
              </Typography>
              <Typography className={classes.totalNumber}>
                {summary.totalApplications}
              </Typography>
              <Typography className={classes.subtitle}>
                All registered applications
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card className={classes.card}>
            <CardContent className={classes.cardContent}>
              <Typography className={classes.label}>Complete</Typography>
              <Typography className={classes.compliantNumber}>
                {summary.compliant}
              </Typography>
              <Typography className={classes.subtitle}>
                Total completed audits
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card className={classes.card}>
            <CardContent className={classes.cardContent}>
              <Typography className={classes.label}>In Progress</Typography>
              <Typography className={classes.inProgressNumber}>
                {summary.inProgress}
              </Typography>
              <Typography className={classes.subtitle}>
                Total audits in progress
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
