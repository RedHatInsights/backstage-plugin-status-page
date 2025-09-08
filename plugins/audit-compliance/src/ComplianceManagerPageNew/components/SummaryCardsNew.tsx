import React from 'react';
import { Card, CardContent, Grid, Typography, Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
  card: {
    height: '200px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    borderRadius: '16px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
    },
  },
  cardContent: {
    textAlign: 'center',
    padding: theme.spacing(4),
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  label: {
    fontSize: '18px',
    fontWeight: 500,
    marginBottom: theme.spacing(3),
    color: theme.palette.text.secondary,
    letterSpacing: '0.5px',
  },
  number: {
    fontSize: '64px',
    fontWeight: 700,
    lineHeight: 1,
    marginBottom: theme.spacing(2),
  },
  totalNumber: {
    fontSize: '64px',
    fontWeight: 700,
    lineHeight: 1,
    marginBottom: theme.spacing(2),
    color: '#1976d2',
  },
  compliantNumber: {
    fontSize: '64px',
    fontWeight: 700,
    lineHeight: 1,
    marginBottom: theme.spacing(2),
    color: '#4CAF50',
  },
  inProgressNumber: {
    fontSize: '64px',
    fontWeight: 700,
    lineHeight: 1,
    marginBottom: theme.spacing(2),
    color: '#FF9800',
  },
  nonCompliantNumber: {
    fontSize: '64px',
    fontWeight: 700,
    lineHeight: 1,
    marginBottom: theme.spacing(2),
    color: '#F44336',
  },
  subtitle: {
    fontSize: '14px',
    color: theme.palette.text.secondary,
    fontWeight: 400,
  },
}));

interface ComplianceSummary {
  totalApplications: number;
  compliant: number;
  nonCompliant: number;
  inProgress: number;
  pending: number;
}

interface SummaryCardsNewProps {
  summary: ComplianceSummary;
}

export const SummaryCardsNew: React.FC<SummaryCardsNewProps> = ({
  summary,
}) => {
  const classes = useStyles();

  return (
    <Box>
      <Typography
        variant="h3"
        style={{
          textAlign: 'center',
          marginBottom: '48px',
          fontWeight: 300,
          color: '#333',
          letterSpacing: '-0.5px',
        }}
      >
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
