import { Content, Header, HeaderLabel, Page } from '@backstage/core-components';
import {
  alertApiRef,
  configApiRef,
  discoveryApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import {
  Card,
  CardContent,
  IconButton,
  Tooltip,
  useTheme,
} from '@material-ui/core';
import RefreshIcon from '@material-ui/icons/Refresh';
import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import ChatbotInput from '../DocsBotDrawer/DocsBotInput/DocsBotInput';
import ChatbotMessage from '../DocsBotDrawer/DocsBotMessage/DocsBotMessage';
import useStyles from './DocsBotPage.styles';
import InfoTiles from './InfoTiles/InfoTiles';
import { disclaimer } from '../DocsBotDrawer/DocsBotDrawer';

interface ChatMessage {
  content: string;
  isUserMessage: boolean;
  userQuestion?: string;
}

export const DocsBotPage = () => {
  const theme = useTheme();
  const config = useApi(configApiRef);
  const classes = useStyles(theme);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [isInputDisabled, setIsInputDisabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userQuestion, setUserQuestion] = useState<string>('');
  const docsBotSlackUrl = config.getOptionalString('docsbot.slackUrl');
  const docsBotContactMail = config.getOptionalString('docsbot.contactMail');
  const [baseUrl, setBaseUrl] = React.useState<string | undefined>();
  const discoveryApiRefDocsBot = useApi(discoveryApiRef);
  const [timeTaken, setTimeTaken] = useState<string | undefined>(undefined);
  const alertApi = useApi(alertApiRef);

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
  useEffect(() => {
    sendInitialMessage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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
    appendMessageToLastBotMessage(botResponse);
    setUserQuestion(question);
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
  return (
    <Page themeId="tool">
      <Header
        title="Welcome to DocsBot!"
        subtitle=" 
Assistance with Your Document Questions."
      >
        <HeaderLabel label="Owner" value="Team DocsBot" />
        <HeaderLabel label="Lifecycle" value="Alpha" />
        {docsBotSlackUrl && (
          <HeaderLabel
            label="Slack"
            value={
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={docsBotSlackUrl}
              >
                #forum-docsbot
              </a>
            }
          />
        )}
        {docsBotContactMail && (
          <HeaderLabel
            label="Mail"
            value={
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={docsBotContactMail}
              >
                #docsBot
              </a>
            }
          />
        )}
      </Header>
      <Content>
        <Card>
          <CardContent>
            <div className={classes.container}>
              <CardContent className={classes.cardContent}>
                <div className={classes.menuSection}>
                  <Tooltip title="Refresh Chat">
                    <IconButton onClick={handleRefresh}>
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                </div>
                {userQuestion === '' ? (
                  <InfoTiles />
                ) : (
                  <>
                    {chatMessages.map((message, index) => (
                      <ChatbotMessage
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
                <ChatbotInput
                  onSendMessage={handleSendMessage}
                  isInputDisabled={isInputDisabled}
                  placeholder={
                    isInputDisabled
                      ? 'Kindly wait for bot to finish the response'
                      : 'Type your query here...'
                  }
                  isPanel={false}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </Content>
    </Page>
  );
};
