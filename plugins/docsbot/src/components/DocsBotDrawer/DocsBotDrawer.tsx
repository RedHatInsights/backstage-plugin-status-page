import {
  alertApiRef,
  discoveryApiRef,
  useApi,
  useRouteRef,
} from '@backstage/core-plugin-api';
import {
  CardContent,
  Chip,
  Drawer,
  Grid,
  IconButton,
  Tooltip,
  Typography,
  useTheme,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import OpenInNewOutlinedIcon from '@material-ui/icons/OpenInNewOutlined';
import RefreshIcon from '@material-ui/icons/Refresh';
import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import { rootRouteRef } from '../../routes';
import useStyles from './DocsBotDrawer.styles';
import { DocsBotInfoTiles } from './DocsBotInfoTiles/DocsBotInfoTiles';
import DocsBotInput from './DocsBotInput/DocsBotInput';
import DocsBotMessage from './DocsBotMessage/DocsBotMessage';

interface ChatMessage {
  content: string;
  isUserMessage: boolean;
  userQuestion?: string;
}
type Props = {
  isOpen: boolean;
  toggleDrawer: () => void;
};

export const disclaimer =
  '<b><i>Note: You are about to use a tool that utilizes Artificial Intelligence (AI) to process inputs and provide responses. Please do not include any personal, customer, or partner confidential information in your chat interaction with the AI. By proceeding to use the tool, you acknowledge that the tool and any information provided are intended for internal use only, and that information obtained should only be shared with those who have a legitimate business purpose.</i></b>';

export const DocsBotDrawer = ({ isOpen, toggleDrawer }: Props) => {
  const theme = useTheme();
  const classes = useStyles(theme);
  const alertApi = useApi(alertApiRef);
  const discoveryApiRefDocsBot = useApi(discoveryApiRef);
  const docsBotLink = useRouteRef(rootRouteRef); // Use the route reference

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [isInputDisabled, setIsInputDisabled] = useState(false);
  const [userQuestion, setUserQuestion] = useState<string>('');
  const [timeTaken, setTimeTaken] = useState<string | undefined>(undefined);
  const [baseUrl, setBaseUrl] = useState<string | undefined>();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    });
  };

  const appendMessage = (
    message: string,
    isUserMessage: boolean,
    question?: string,
  ): void => {
    setChatMessages(prevMessages => [
      ...prevMessages,
      { content: message, isUserMessage, question },
    ]);
    scrollToBottom();
  };

  const sendInitialMessage = (): void => {
    if (chatMessages.length === 0) {
      appendMessage(disclaimer, false);
      const initialMessage = `Hi! 😊 I’m DocsBot, I’m here to help you with any questions or issues.`;
      appendMessage(initialMessage, false);
    }
  };

  useEffect(() => {
    // NOTE:This should be called only when component is mounted hence eslint disable
    sendInitialMessage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFeedback = async (
    message: string,
    feedback: number,
    question?: string,
  ) => {
    try {
      if (baseUrl) {
        await axios.post(
          `${baseUrl}/docsbot-feedback`,
          { message, feedback, UserQuestion: question },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );
        alertApi.post({
          message: 'Feedback submitted successfully.',
          severity: 'success',
        });
      }
    } catch (error) {
      alertApi.post({
        message: 'Failed to submit feedback for bot message.',
        severity: 'error',
      });
    }
  };

  const logFeedback = (
    message: string,
    feedback: number,
    question?: string,
  ) => {
    handleFeedback(message, feedback, question);
  };

  const appendMessageToLastBotMessage = (message: string): void => {
    setChatMessages(prevMessages => {
      const lastMessageIndex = prevMessages.length - 1;
      if (
        lastMessageIndex >= 0 &&
        !prevMessages[lastMessageIndex].isUserMessage
      ) {
        const updatedMessage = `${prevMessages[lastMessageIndex].content} ${message}`;
        prevMessages[lastMessageIndex].content = updatedMessage;
        return [...prevMessages];
      }
      return [...prevMessages, { content: message, isUserMessage: false }];
    });
    scrollToBottom();
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleBotResponse = async (
    botResponse: string,
    question: string,
  ): Promise<void> => {
    setIsBotTyping(false);
    setIsInputDisabled(false);
    setUserQuestion(question);
    if (botResponse) {
      appendMessageToLastBotMessage(botResponse);
    }
  };

  const handleSendMessage = async (userMessage: string): Promise<void> => {
    appendMessage(userMessage, true);
    setIsBotTyping(true);
    setUserQuestion(userMessage);
    setIsInputDisabled(true);
  };

  useEffect(() => {
    if (!baseUrl) {
      discoveryApiRefDocsBot.getBaseUrl('proxy').then(proxy => {
        setBaseUrl(`${proxy}/docsbot`); // Use template literal here
      });
    }

    if (baseUrl) {
      const eventSource = new EventSource(
        `${baseUrl}/query-stream?query=${userQuestion}`,
      );
      let fullMessage = '';
      eventSource.onmessage = event => {
        const { text, time_taken } = JSON.parse(event.data);
        handleBotResponse(text, userQuestion);
        fullMessage += text;
        setTimeTaken(time_taken);
      };
      eventSource.onerror = () => {
        if (chatMessages.length > 2) {
          logFeedback(fullMessage, 0, userQuestion);
        }
        eventSource.close();
      };
      return () => {
        eventSource.close();
      };
    }

    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userQuestion, baseUrl]);

  const handleRefresh = () => {
    setChatMessages([]);
    setIsBotTyping(false);
    setIsInputDisabled(false);
    setUserQuestion('');
  };

  const handleExpand = () => {
    toggleDrawer();
    window.location.href = docsBotLink(); // Use useRouteRef for routing
  };

  return (
    <div>
      <Drawer
        variant="persistent"
        anchor="right"
        open={isOpen}
        onClose={toggleDrawer}
      >
        <div className={classes.fullHeightContainer}>
          <div className={classes.menuSection}>
            <div className={classes.docsBotSection}>
              <Grid container spacing={2}>
                <Grid item xs={8}>
                  <Typography variant="h4" className={classes.docsBotName}>
                    DocsBot
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Chip
                    style={{ margin: '8px 0px 0px 0px' }}
                    label="Beta"
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </div>

            <div className={classes.iconsSection}>
              <Tooltip title="Refresh Chat">
                <IconButton onClick={handleRefresh}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Expand Chat">
                <IconButton onClick={handleExpand}>
                  <OpenInNewOutlinedIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Close Chat">
                <IconButton onClick={toggleDrawer}>
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            </div>
          </div>

          <div className={classes.container}>
            <CardContent className={classes.cardContent}>
              {userQuestion === '' ? (
                <>
                  <DocsBotInfoTiles />
                </>
              ) : (
                <>
                  {chatMessages.map((message, index) => (
                    <DocsBotMessage
                      key={`message-${index}`}
                      message={message.content}
                      isUserMessage={message.isUserMessage}
                      onFeedback={handleFeedback}
                      userQuestion={userQuestion}
                      isInitialMessage={index === 0 || index === 1}
                      timeTaken={timeTaken}
                    />
                  ))}
                  {isBotTyping && (
                    <div className={classes.chatBubble}>
                      <div className={classes.typing}>
                        <div className={`${classes.dot} ${classes.dot1}`} />
                        <div className={`${classes.dot} ${classes.dot2}`} />
                        <div className={`${classes.dot} ${classes.dot3}`} />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </CardContent>
            <div className={classes.inputContainer}>
              <DocsBotInput
                onSendMessage={handleSendMessage}
                isInputDisabled={isInputDisabled}
                placeholder={
                  isInputDisabled
                    ? 'Kindly wait for bot to finish the response'
                    : 'Type your query here...'
                }
              />
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  );
};
