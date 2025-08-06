import React from 'react';
import { Card, CardContent, Grid, Typography, Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
  card: {
    height: '140px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
    },
  },
  cardContent: {
    textAlign: 'center',
    padding: theme.spacing(3),
  },
  label: {
    fontSize: '16px',
    fontWeight: 500,
    marginBottom: theme.spacing(2),
    color: theme.palette.text.secondary,
  },
  number: {
    fontSize: '48px',
    fontWeight: 700,
    lineHeight: 1.2,
    marginBottom: theme.spacing(1),
  },
  totalNumber: {
    fontSize: '48px',
    fontWeight: 700,
    lineHeight: 1.2,
    marginBottom: theme.spacing(1),
    color: '#1976d2',
  },
  compliantNumber: {
    fontSize: '48px',
    fontWeight: 700,
    lineHeight: 1.2,
    marginBottom: theme.spacing(1),
    color: '#4CAF50',
  },
  inProgressNumber: {
    fontSize: '48px',
    fontWeight: 700,
    lineHeight: 1.2,
    marginBottom: theme.spacing(1),
    color: '#FF9800',
  },
  nonCompliantNumber: {
    fontSize: '48px',
    fontWeight: 700,
    lineHeight: 1.2,
    marginBottom: theme.spacing(1),
    color: '#F44336',
  },
}));

interface ComplianceSummary {
  totalApplications: number;
  compliant: number;
  nonCompliant: number;
  inProgress: number;
  pending: number;
}

interface ComplianceSummaryCardsProps {
  summary: ComplianceSummary;
}

export const ComplianceSummaryCards: React.FC<ComplianceSummaryCardsProps> = ({
  summary,
}) => {
  const classes = useStyles();

  return (
    <Grid container spacing={3} style={{ marginBottom: 32 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card className={classes.card}>
          <CardContent className={classes.cardContent}>
            <Typography className={classes.label}>
              Total Applications
            </Typography>
            <Typography className={classes.totalNumber}>
              {summary.totalApplications}
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
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};
