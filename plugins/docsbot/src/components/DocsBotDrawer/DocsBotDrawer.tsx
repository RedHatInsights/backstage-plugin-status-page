import {
  alertApiRef,
  discoveryApiRef,
  identityApiRef,
  useApi,
  useRouteRef,
  useAnalytics,
} from '@backstage/core-plugin-api';
import {
  CardContent,
  Chip,
  Drawer,
  FormControlLabel,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Switch,
  Tooltip,
  Typography,
  useTheme,
} from '@material-ui/core';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import InfoIcon from '@material-ui/icons/Info';
import MenuIcon from '@material-ui/icons/Menu';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import RefreshIcon from '@material-ui/icons/Refresh';
import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import { rootRouteRef } from '../../routes';
import useStyles from './DocsBotDrawer.styles';
import DocsBotExpectationBanner from './DocsBotExpectationBanner/DocsBotExpectationBanner';
import { DocsBotInfoTiles } from './DocsBotInfoTiles/DocsBotInfoTiles';
import DocsBotInput from './DocsBotInput/DocsBotInput';
import DocsBotMessage from './DocsBotMessage/DocsBotMessage';

interface ChatMessage {
  content: string;
  isUserMessage: boolean;
  userQuestion?: string;
  timeTaken?: string;
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
  const identityApi = useApi(identityApiRef);
  const discoveryApiRefDocsBot = useApi(discoveryApiRef);
  const docsBotLink = useRouteRef(rootRouteRef); // Use the route reference
  const [previousQuestion, setPreviousQuestion] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [isInputDisabled, setIsInputDisabled] = useState(false);
  const [userQuestion, setUserQuestion] = useState<string>('');
  const [baseUrl, setBaseUrl] = useState<string | undefined>();
  const [isBannerOpen, setIsBannerOpen] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const analytics = useAnalytics();
  const [username, setUsername] = useState<string | undefined>(undefined);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [workspaceAnchorEl, setWorkspaceAnchorEl] =
    useState<null | HTMLElement>(null);
  const [selectedNamespaceOption, setSelectedNamespaceOption] =
    useState<string>('backstage');
  const [isCacheEnabled, setIsCacheEnabled] = useState<boolean>(true);
  const handleCacheToggle = () => {
    setIsCacheEnabled(prev => !prev);
  };

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

  useEffect(() => {
    getCurrentUser();
    // NOTE:This should be called only when component is mounted hence eslint disable
    sendInitialMessage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

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
    setPreviousQuestion(userMessage);
  };
  const nocache = isCacheEnabled ? 0 : 1;
  useEffect(() => {
    if (!baseUrl) {
      discoveryApiRefDocsBot.getBaseUrl('proxy').then(proxy => {
        setBaseUrl(`${proxy}/docsbot`);
      });
    }

    if (baseUrl) {
      const eventSource = new EventSource(
        `${baseUrl}/query-stream?query=${userQuestion}&workspace=${selectedNamespaceOption}&nocache=${nocache}`,
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
    setIsCacheEnabled(true);
    analytics.captureEvent('click', 'Docsbot session refreshed');
  };

  const handleInfoIconClick = () => {
    setIsBannerOpen(true);
  };

  const handleSettingsClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleWorkspaceClick = (event: React.MouseEvent<HTMLElement>) => {
    setWorkspaceAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setWorkspaceAnchorEl(null);
  };

  const handleWorkspaceOptionClick = (option: string) => {
    setSelectedNamespaceOption(option);
    handleClose();
    analytics.captureEvent('click', `Docsbot source changed: ${option}`);
  };

  const handleExpand = () => {
    toggleDrawer();
    window.location.href = docsBotLink();
    analytics.captureEvent('navigate', '/docsbot');
    handleClose();
  };

  const handleCloseBanner = () => {
    setIsBannerOpen(false);
    toggleDrawer();
  };

  const getWorkspaceTitle = (option: string): string => {
    const titles: Record<string, string> = {
      backstage: 'Backstage',
      portfolio_management_and_strategy: 'Portfolio Management and Strategy',
      spaship_docs: 'SPAship',
    };

    const title = titles[option] || 'Unknown Workspace';
    return title;
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
                <Grid item xs={4} style={{ padding: 0 }}>
                  <Chip
                    style={{ margin: '8px 0px 0px 0px', padding: 0 }}
                    label="Beta"
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </div>

            <div className={classes.iconsSection}>
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
              <Tooltip title="Settings">
                <IconButton onClick={handleSettingsClick}>
                  <MenuIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="Expand window">
                <IconButton onClick={handleExpand}>
                  <OpenInNewIcon />
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                {/* Workspace Option */}
                <MenuItem
                  onClick={handleWorkspaceClick}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    width: '200px',
                  }}
                >
                  <Tooltip title={getWorkspaceTitle(selectedNamespaceOption)}>
                    <span className="workspaceName">
                      Source:&nbsp;
                      {getWorkspaceTitle(selectedNamespaceOption).length > 11
                        ? `${getWorkspaceTitle(selectedNamespaceOption).slice(
                            0,
                            11,
                          )}...`
                        : getWorkspaceTitle(selectedNamespaceOption)}
                    </span>
                  </Tooltip>

                  <ArrowDropDownIcon fontSize="small" />
                </MenuItem>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isCacheEnabled}
                      onChange={handleCacheToggle}
                      color="primary"
                    />
                  }
                  label={`Cache ${isCacheEnabled ? 'Enabled' : 'Disabled'}`}
                  labelPlacement="start"
                />

                <MenuItem
                  onClick={() => {
                    toggleDrawer();
                    handleClose();
                  }}
                >
                  Close Chat
                </MenuItem>
              </Menu>

              <Menu
                anchorEl={workspaceAnchorEl}
                open={Boolean(workspaceAnchorEl)}
                onClose={handleClose}
              >
                {[
                  'backstage',
                  'portfolio_management_and_strategy',
                  'spaship_docs',
                ].map(option => (
                  <MenuItem
                    key={option}
                    onClick={() => handleWorkspaceOptionClick(option)}
                    style={{
                      fontWeight:
                        selectedNamespaceOption === option ? 'bold' : 'normal',
                      minWidth: '150px',
                    }}
                  >
                    {getWorkspaceTitle(option)}
                  </MenuItem>
                ))}
              </Menu>
            </div>
          </div>
          <DocsBotExpectationBanner
            open={isBannerOpen}
            onClose={handleCloseBanner}
          />

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
                      timeTaken={message.timeTaken}
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
              <div className={classes.disclaimer}>
                Disclaimer: Due to hardware constraints, responses may be
                delayed, and since DocsBot is still in training, some answers
                may not be accurate.
              </div>
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  );
};
