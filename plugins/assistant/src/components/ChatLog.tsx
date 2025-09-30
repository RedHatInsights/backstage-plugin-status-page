import { makeStyles, Theme } from '@material-ui/core';
import Box from '@material-ui/core/Box';
import { ThemeConfig } from '@red-hat-developer-hub/backstage-plugin-theme';
import { useContext, useEffect } from 'react';
import { useInterval } from 'react-use';
import { AgentContext } from '../contexts/AgentProvider';
import { User } from '../types';
import { ChatBubble } from './ChatBubble';
import { UserGreeting } from './UserGreeting';

const useStyles = makeStyles<Theme & ThemeConfig>(theme => ({
  chatLog: {
    paddingBottom: theme.spacing(2),
    backgroundColor:
      theme.palette.mode === 'light'
        ? theme.palette.background.default
        : theme.palette.background.paper,
  },
}));

export interface ChatLogProps {
  user?: User;
}

export const ChatLog = ({ user }: ChatLogProps) => {
  const classes = useStyles();
  const { messages, reloadChat } = useContext(AgentContext);
  const chatContainerRef = document.getElementById('chatWindow');

  /* Chat polling every 5 secs */
  useInterval(() => {
    reloadChat?.();
  }, 5 * 1000);

  useEffect(() => {
    if (chatContainerRef) {
      chatContainerRef.scrollBy({
        behavior: 'smooth',
        top: chatContainerRef.scrollHeight,
      });
    }
  }, [chatContainerRef]);

  return (
    <Box
      id="chatWindow"
      flex={1}
      className={classes.chatLog}
      p={2}
      pb={0}
      display="flex"
      flexDirection="column"
      justifyContent="stretch"
      overflow="auto"
    >
      {user && <UserGreeting user={user} />}
      {messages?.map(message => (
        <ChatBubble message={message} />
      ))}
    </Box>
  );
};
