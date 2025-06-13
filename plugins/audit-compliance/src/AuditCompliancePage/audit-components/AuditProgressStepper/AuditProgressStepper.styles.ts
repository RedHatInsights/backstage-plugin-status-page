import { Theme } from "@material-ui/core";

import { makeStyles } from "@material-ui/core/styles";

export const useStyles = makeStyles((theme: Theme) => ({
  stepper: {
    backgroundColor: 'transparent',
    padding: theme.spacing(1, 0),
    '& .MuiStep-root': {
      padding: theme.spacing(0.5, 0),
    },
    '& .MuiStepLabel-root': {
      padding: theme.spacing(0, 0.5),
    },
    '& .MuiStepConnector-line': {
      borderColor: theme.palette.grey[300],
      borderTopWidth: 2,
    },
    '& .MuiStepLabel-label': {
      fontSize: theme.typography.body2.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
      color: theme.palette.text.primary,
      '&.MuiStepLabel-active': {
        color: theme.palette.primary.main,
        fontWeight: theme.typography.fontWeightBold,
      },
      '&.MuiStepLabel-completed': {
        color: theme.palette.text.secondary,
      },
    },
    '& .MuiStepIcon-root': {
      width: 24,
      height: 24,
      '&.MuiStepIcon-active': {
        color: theme.palette.primary.main,
      },
      '&.MuiStepIcon-completed': {
        color: theme.palette.success.main,
      },
    },
  },
  stepIcon: {
    width: 24,
    height: 24,
    color: theme.palette.grey[400],
    '& circle': {
      fill: theme.palette.grey[400],
    },
  },
  activeStepIcon: {
    width: 24,
    height: 24,
    color: theme.palette.primary.main,
    '& circle': {
      fill: theme.palette.primary.main,
    },
  },
  completedStepIcon: {
    width: 24,
    height: 24,
    color: theme.palette.success.main,
    '& circle': {
      fill: theme.palette.success.main,
    },
  },
  stepContent: {
    marginTop: theme.spacing(1),
    paddingLeft: theme.spacing(3),
  },
  stepDescription: {
    color: theme.palette.text.secondary,
    fontSize: theme.typography.caption.fontSize,
  },
}));
