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
    marginBottom: theme.spacing(1),
  },
  value: {
    fontWeight: 'bold',
    overflow: 'hidden',
    lineHeight: '24px',
    wordBreak: 'break-word',
    color: theme.palette.text.primary,
  },
}));

export interface DetailsFieldProps {
  label: string;
  value?: string;
  gridSizes?: Record<string, any>;
  children?: React.ReactNode;
}

export const DetailsField = ({
  label,
  value,
  gridSizes,
  children,
}: DetailsFieldProps) => {
  const classes = useStyles();

  const childElements = useElementFilter(children, child => child.getElements());

  const renderContent = (): React.ReactNode => {
    if (childElements.length > 0) {
      return childElements;
    }

    if (value) {
      return (
        <Typography variant="body1" className={classes.value}>
          {value}
        </Typography>
      );
    }

    return (
      <Typography variant="body1" className={classes.value}>
        Not specified
      </Typography>
      );
  };

  return (
    <Grid item {...gridSizes}>
      <Typography variant="h2" className={classes.label}>
        {label}
      </Typography>
      {renderContent()}
    </Grid>
  );
};
