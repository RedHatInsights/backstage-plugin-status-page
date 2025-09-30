import { ProfileInfo } from '@backstage/core-plugin-api';
import { makeStyles, Paper } from '@material-ui/core';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';

const useStyles = makeStyles(theme => ({
  card: {
    position: 'relative',
    overflow: 'hidden',
    marginTop: theme.spacing(1),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.shape.borderRadius * 3,
  },
}));

const AssistantFeatures = [
  {
    title: 'Unified Access to information',
  },
  {
    title: 'Intelligent Search Capabilities',
  },
  {
    title: 'Self-Service',
  },
];

export interface UserGreetingProps {
  user: ProfileInfo & { userRef?: string; username?: string };
}

export const UserGreeting = ({ user }: UserGreetingProps) => {
  const classes = useStyles();

  return (
    <Box
      flexGrow={1}
      flexShrink={0}
      width="100%"
      display="flex"
      flexDirection="column"
      justifyContent="flex-start"
      mt={2}
      mb={8}
    >
      <Typography variant="h2" color="secondary">
        <Box fontWeight="600">Hi {user?.displayName ?? user?.username}!</Box>
      </Typography>
      <Typography variant="h3" color="textPrimary">
        How may I help you?
      </Typography>
      {AssistantFeatures.map((feature, index) => (
        <Paper key={index} variant="elevation" className={classes.card}>
          <Typography variant="subtitle2" color="textSecondary">
            {feature.title}
          </Typography>
        </Paper>
      ))}
    </Box>
  );
};
