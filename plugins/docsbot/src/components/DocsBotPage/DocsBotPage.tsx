import { Content, Header, HeaderLabel, Page } from '@backstage/core-components';
import {
  alertApiRef,
  configApiRef,
  discoveryApiRef,
  identityApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import {
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
} from '@material-ui/core';
import InfoIcon from '@material-ui/icons/Info';
import RefreshIcon from '@material-ui/icons/Refresh';
import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import { disclaimer } from '../DocsBotDrawer/DocsBotDrawer';
import DocsBotExpectationBanner from '../DocsBotDrawer/DocsBotExpectationBanner/DocsBotExpectationBanner';
import DocsBotInput from '../DocsBotDrawer/DocsBotInput/DocsBotInput';
import DocsBotMessage from '../DocsBotDrawer/DocsBotMessage/DocsBotMessage';
import useStyles from './DocsBotPage.styles';
import InfoTiles from './InfoTiles/InfoTiles';

interface ChatMessage {
  content: string;
  isUserMessage: boolean;
  userQuestion?: string;
  timeTaken?: string;
}

export const DocsBotPage = () => {
  const theme = useTheme();
  const config = useApi(configApiRef);
  const identityApi = useApi(identityApiRef);
  const classes = useStyles(theme);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [isInputDisabled, setIsInputDisabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userQuestion, setUserQuestion] = useState<string>('');
  const [previousQuestion, setPreviousQuestion] = useState<string | null>(null);
  const docsBotSlackUrl = config.getOptionalString('docsbot.slackUrl');
  const docsBotContactMail = config.getOptionalString('docsbot.contactMail');
  const [baseUrl, setBaseUrl] = React.useState<string | undefined>();
  const discoveryApiRefDocsBot = useApi(discoveryApiRef);
  const alertApi = useApi(alertApiRef);
  const [isBannerOpen, setIsBannerOpen] = useState<boolean>(false);
  const [username, setUsername] = useState<string | undefined>(undefined);
  const getCurrentUser = async () => {
    try {
      const identity = await identityApi.getBackstageIdentity();
      const user = identity.userEntityRef;
      setUsername(user);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching current user:', error);
    }
  };

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
    question: string,
    description?: string | undefined,
  ) => {
    try {
      if (baseUrl) {
        await axios.post(
          `${baseUrl}/docsbot-feedback`,
          {
            answer: message,
            description,
            feedback,
            question,
            user: username,
          },
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
      // eslint-disable-next-line no-console
      console.log('error', error);
    }
  };

  const logFeedback = (
    message: string,
    feedback: number,
    question: string,
    description?: string | undefined,
  ) => {
    handleFeedback(message, feedback, question, description);
  };

  useEffect(() => {
    getCurrentUser();
    sendInitialMessage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const appendMessageToLastBotMessage = (
    message: string,
    timeTaken?: string,
  ): void => {
    setChatMessages(prevMessages => {
      const lastMessageIndex = prevMessages.length - 1;
      if (
        lastMessageIndex >= 0 &&
        !prevMessages[lastMessageIndex].isUserMessage
      ) {
        prevMessages[lastMessageIndex].content += message;

        if (timeTaken) {
          prevMessages[lastMessageIndex].timeTaken = timeTaken;
        }

        return [...prevMessages];
      }
      return [
        ...prevMessages,
        {
          content: message.trim().replace(/\n/g, '<br/>'), // Process message
          isUserMessage: false,
          timeTaken,
        },
      ];
    });
    scrollToBottom();
  };

  const handleBotResponse = async (
    botResponse: string,
    question: string,
    timeTaken: string,
  ): Promise<void> => {
    setIsBotTyping(false);
    setIsInputDisabled(false);

    if (botResponse?.trim().toLowerCase() === 'empty response') {
      const apologyMessage =
        'Sorry, I couldn’t find an answer to your question. Currently, DocsBot supports content from Backstage and Spaship. Could you please try rephrasing your question or ask something else?';
      appendMessageToLastBotMessage(apologyMessage, timeTaken);
    } else {
      appendMessageToLastBotMessage(botResponse || '', timeTaken);
    }

    setUserQuestion(question);
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleSendMessage = async (userMessage: string): Promise<void> => {
    // Check if the current question is the same as the previous one
    if (
      userMessage.trim().toLowerCase() ===
      previousQuestion?.trim().toLowerCase()
    ) {
      // Respond with the specific message and reset input
      appendMessage(
        'It seems like you have asked the same question which I have already answered. Do you want to ask something else?',
        false,
      );
      setIsBotTyping(false);
      setIsInputDisabled(false);
      return;
    }

    appendMessage(userMessage, true);
    setIsBotTyping(true);
    setUserQuestion(userMessage);
    setIsInputDisabled(true);

    // Update the previous question
    setPreviousQuestion(userMessage);
  };

  useEffect(() => {
    if (!baseUrl) {
      discoveryApiRefDocsBot.getBaseUrl('proxy').then(proxy => {
        setBaseUrl(`${proxy}/docsbot`);
      });
    }
    if (baseUrl) {
      const eventSource = new EventSource(
        `${baseUrl}/query-stream?query=${userQuestion}`,
      );

      let fullMessage = '';
      eventSource.onmessage = event => {
        const { text, time_taken } = JSON.parse(event.data);
        fullMessage += text;
        handleBotResponse(text, userQuestion, time_taken);
      };
      eventSource.onerror = () => {
        if (chatMessages.length > 2) {
          logFeedback(fullMessage, 0, userQuestion, '');
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
    setPreviousQuestion(null);
  };

  useEffect(() => {
    setIsBannerOpen(true);
  }, []);

  const handleCloseBanner = () => {
    setIsBannerOpen(false);
  };

  const handleInfoIconClick = () => {
    setIsBannerOpen(true);
  };

  return (
    <Page themeId="tool">
      <Header
        title=" Welcome to DocsBot!"
        subtitle={
          <>
            Assistance with Your Document Questions. &nbsp;
            <Chip
              label="Beta"
              size="small"
              variant="outlined"
              color="primary"
            />
          </>
        }
      >
        <HeaderLabel label="Owner" value="Team DocsBot" />
        <HeaderLabel label="Lifecycle" value="Beta" />
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
      <Content className={classes.content}>
        <Card className={classes.card}>
          <CardContent className={classes.cardContent}>
            <div className={classes.container}>
              <div className={classes.menuSection}>
                <Tooltip title="DocsBot Expectations">
                  <IconButton onClick={handleInfoIconClick}>
                    <InfoIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Refresh Chat">
                  <IconButton onClick={handleRefresh}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>

                <DocsBotExpectationBanner
                  open={isBannerOpen}
                  onClose={handleCloseBanner}
                />
              </div>
              <div className={classes.messagesContainer}>
                {userQuestion === '' ? (
                  <InfoTiles />
                ) : (
                  <>
                    {chatMessages.map((message, index) => {
                      return (
                        <DocsBotMessage
                          key={`message-${index}`}
                          message={message.content}
                          isUserMessage={message.isUserMessage}
                          onFeedback={handleFeedback}
                          userQuestion={userQuestion}
                          isInitialMessage={index === 0 || index === 1}
                          timeTaken={message.timeTaken} // Pass timeTaken from message
                        />
                      );
                    })}
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
              </div>
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

              <div className={classes.disclaimer}>
                Disclaimer: Due to hardware constraints, responses may be
                delayed, and since DocsBot is still in training, some answers
                may not be accurate.
              </div>
            </div>
          </CardContent>
        </Card>
      </Content>
    </Page>
  );
};
