import React from 'react';
import { Card, CardContent, Grid, Typography } from '@material-ui/core';

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
  return (
    <Grid container spacing={3} style={{ marginBottom: 32 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Applications
            </Typography>
            <Typography variant="h4">{summary.totalApplications}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Compliant
            </Typography>
            <Typography variant="h4" style={{ color: '#4CAF50' }}>
              {summary.compliant}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              In Progress
            </Typography>
            <Typography variant="h4" style={{ color: '#FF9800' }}>
              {summary.inProgress}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Non-Compliant
            </Typography>
            <Typography variant="h4" style={{ color: '#F44336' }}>
              {summary.nonCompliant}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};
