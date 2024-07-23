import { Button, Tooltip, useTheme } from '@material-ui/core';
import ThumbDownIcon from '@material-ui/icons/ThumbDown';
import ThumbUpIcon from '@material-ui/icons/ThumbUp';
import React from 'react';
import useStyles from './DocsBotMessage.styles';

interface DocsBotMessageProps {
  message: string;
  isUserMessage: boolean;
  onFeedback: (message: string, feedback: number, question?: string) => void;
  userQuestion: string;
  isInitialMessage: boolean;
  timeTaken?: string;
}

const DocsBotMessage: React.FC<DocsBotMessageProps> = ({
  message,
  isUserMessage,
  onFeedback,
  userQuestion,
  isInitialMessage,
  timeTaken,
}) => {
  const theme = useTheme();
  const classes = useStyles(theme);

  const handleFeedback = (feedbackValue: number) => {
    onFeedback(message, feedbackValue, userQuestion);
  };

  return (
    <div
      key={message}
      className={`${classes.message} ${
        isUserMessage ? classes.userMessage : classes.botMessage
      }`}
    >
      <div
        className={
          isUserMessage
            ? classes.userMessageContainer
            : classes.botMessageContainer
        }
      >
        <div
          className={classes.messageContent}
          dangerouslySetInnerHTML={{ __html: message }}
        />
        {!isUserMessage && !isInitialMessage && (
          <div>
            <Button
              variant="text"
              onClick={() => handleFeedback(1)}
              style={{ padding: '0px' }}
              title="Happy with answer"
            >
              <Tooltip title="Liked the answer">
                <ThumbUpIcon />
              </Tooltip>
            </Button>

            <Button
              variant="text"
              onClick={() => handleFeedback(-1)}
              style={{ padding: '0px' }}
              title="Unhappy with answer"
            >
              <Tooltip title="Unhappy with answer">
                <ThumbDownIcon />
              </Tooltip>
            </Button>
          </div>
        )}
        {!isUserMessage && timeTaken && (
          <div className={classes.timeTaken}>Time taken: {timeTaken} secs</div>
        )}
      </div>
    </div>
  );
};

export default DocsBotMessage;
