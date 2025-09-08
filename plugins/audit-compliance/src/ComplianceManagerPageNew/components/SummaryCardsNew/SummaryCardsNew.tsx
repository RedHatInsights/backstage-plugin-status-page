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
      <Typography variant="h3" className={classes.title}>
        Compliance Overview
      </Typography>

      <Grid container spacing={4} justifyContent="center">
        <Grid item xs={12} sm={6} md={3}>
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

        <Grid item xs={12} sm={6} md={3}>
          <Card className={classes.card}>
            <CardContent className={classes.cardContent}>
              <Typography className={classes.label}>Compliant</Typography>
              <Typography className={classes.compliantNumber}>
                {summary.compliant}
              </Typography>
              <Typography className={classes.subtitle}>
                Fully compliant applications
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className={classes.card}>
            <CardContent className={classes.cardContent}>
              <Typography className={classes.label}>In Progress</Typography>
              <Typography className={classes.inProgressNumber}>
                {summary.inProgress}
              </Typography>
              <Typography className={classes.subtitle}>
                Audits currently running
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className={classes.card}>
            <CardContent className={classes.cardContent}>
              <Typography className={classes.label}>Non-Compliant</Typography>
              <Typography className={classes.nonCompliantNumber}>
                {summary.nonCompliant}
              </Typography>
              <Typography className={classes.subtitle}>
                Require attention
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
