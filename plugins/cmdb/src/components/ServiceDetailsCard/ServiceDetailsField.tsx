import React from 'react';
import { useElementFilter } from '@backstage/core-plugin-api';
import { Grid, Theme, Typography, makeStyles } from '@material-ui/core';

const useStyles = makeStyles((theme: Theme) => ({
  label: {
    color: theme.palette.text.secondary,
    textTransform: 'uppercase',
    fontSize: '10px',
    fontWeight: 'bold',
    letterSpacing: '0.5px',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  },
  value: {
    fontWeight: 'bold',
    overflow: 'hidden',
    lineHeight: '24px',
    wordBreak: 'break-word',
  },
}));

export interface ServiceDetailsFieldProps {
  label: string;
  value?: string;
  gridSizes?: Record<string, number>;
  children?: React.ReactNode;
}

export const ServiceDetailsField = (props: ServiceDetailsFieldProps) => {
  const { label, value, gridSizes, children } = props;
  const classes = useStyles();

  const childElements = useElementFilter(children, c => c.getElements());

  const content =
    childElements.length > 0 ? (
      childElements
    ) : (
      <Typography variant="body1" className={classes.value}>
        {value || 'unknown'}
      </Typography>
    );

  return (
    <Grid item {...gridSizes}>
      <Typography variant="h2" className={classes.label}>
        {label}
      </Typography>
      {content}
    </Grid>
  );
};
