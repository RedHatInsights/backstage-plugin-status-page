import {
  Box,
  makeStyles,
  Theme,
  Typography,
} from '@material-ui/core';
import { ThemeConfig } from '@red-hat-developer-hub/backstage-plugin-theme';
import clsx from 'clsx';
import { ChatMessage } from '../types';
import { AgentBubbleContent } from './AgentBubbleContent';
import { ErrorBoundary } from '@backstage/core-components';

const useStyles = makeStyles<Theme & ThemeConfig>(theme => ({
  message: {
    maxWidth: '90%',
    wordBreak: 'break-word',
    hyphens: 'auto',
    boxSizing: 'content-box',
  },
  user: {
    marginLeft: 'auto',
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(2),
    padding: theme.spacing(1.5),
    paddingInline: theme.spacing(1.75),
    width: 'fit-content',
    background:
      theme.palette.mode === 'light'
        ? theme.palette.background.paper
        : theme.palette.background.default,
    boxShadow: theme.shadows[1],
    borderWidth: 1,
    borderColor:
      theme.palette.rhdh?.general.cardBorderColor || theme.palette.border,
    borderStyle: 'solid',
    borderRadius: theme.shape.borderRadius * 4,
    borderBottomRightRadius: theme.shape.borderRadius,
  },
  agent: {
    paddingBlock: theme.spacing(0.5),
  },
}));

type Props = {
  message: ChatMessage;
};

export const ChatBubble = ({ message }: Props) => {
  const classes = useStyles();

  const isUser = message.role === 'user';
  const isAgent = (message.role === 'assistant' || message.role === 'tool');

  const UserBubbleContent = () => {
    if (!isUser) return null;
    return <Typography variant="body1">{message.content}</Typography>;
  };

  return (
    <ErrorBoundary>
      <Box className={clsx(classes.message, classes[message.role])}>
        {isUser && <UserBubbleContent />}
        {isAgent && <AgentBubbleContent message={message} />}
      </Box>
    </ErrorBoundary>
  );
};
