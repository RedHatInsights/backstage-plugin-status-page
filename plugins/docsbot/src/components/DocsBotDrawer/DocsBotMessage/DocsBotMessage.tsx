import React, { useState, useEffect } from 'react';
import { Button, Tooltip, useTheme } from '@material-ui/core';
import ThumbDownIcon from '@material-ui/icons/ThumbDown';
import ThumbUpIcon from '@material-ui/icons/ThumbUp';
import { marked } from 'marked';
import DocsBotFeedbackPopup from '../DocsBotFeedbackPopup/DocsBotFeedbackPopup';
import useStyles from './DocsBotMessage.styles';

interface DocsBotMessageProps {
  message: string;
  isUserMessage: boolean;
  onFeedback: (
    message: string,
    feedback: number,
    question: string,
    description?: string | undefined,
  ) => void;
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

  const [feedbackValue, setFeedbackValue] = useState<number | null>(null);
  const [isFeedbackPopupOpen, setIsFeedbackPopupOpen] =
    useState<boolean>(false);
  const [renderedMessage, setRenderedMessage] = useState<string>('');

  const handleFeedback = (feedback: number) => {
    setFeedbackValue(feedback);
    setIsFeedbackPopupOpen(true);
  };

  const handleSubmitFeedback = (description: string) => {
    if (feedbackValue !== null) {
      onFeedback(message, feedbackValue, userQuestion, description);
    }
    setIsFeedbackPopupOpen(false);
  };

  useEffect(() => {
    const convertMarkdown = async () => {
      try {
        const htmlContent = await marked(message);
        setRenderedMessage(htmlContent);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error converting markdown:', error);
        setRenderedMessage('');
      }
    };

    convertMarkdown();
  }, [message]);

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
        <div dangerouslySetInnerHTML={{ __html: renderedMessage }} />
        <div className={classes.footer}>
          {!isUserMessage && timeTaken && (
            <Tooltip title="Bot answered in">
              <div className={classes.timeTaken}>
                {parseFloat(timeTaken) < 1
                  ? 'less than a sec'
                  : `${timeTaken} secs`}
              </div>
            </Tooltip>
          )}
          {!isUserMessage && !isInitialMessage && (
            <div className={classes.feedbackButtons}>
              <Button
                variant="text"
                onClick={() => handleFeedback(1)}
                className={classes.feedbackButton}
                title="Happy with answer"
              >
                <Tooltip title="Liked the answer">
                  <ThumbUpIcon />
                </Tooltip>
              </Button>

              <Button
                variant="text"
                onClick={() => handleFeedback(-1)}
                className={classes.feedbackButton}
                title="Unhappy with answer"
              >
                <Tooltip title="Unhappy with answer">
                  <ThumbDownIcon />
                </Tooltip>
              </Button>
            </div>
          )}
        </div>
      </div>
      <DocsBotFeedbackPopup
        open={isFeedbackPopupOpen}
        onClose={() => setIsFeedbackPopupOpen(false)}
        onSubmit={handleSubmitFeedback}
      />
    </div>
  );
};

export default DocsBotMessage;
