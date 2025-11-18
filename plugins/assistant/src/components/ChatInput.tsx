import {
  Box,
  Fab,
  InputBase,
  makeStyles,
  Paper,
  Theme,
  useTheme,
} from '@material-ui/core';
import SendIcon from '@material-ui/icons/SendRounded';
import { ThemeConfig } from '@red-hat-developer-hub/backstage-plugin-theme';
import { FormEventHandler, useContext, useEffect, useState, KeyboardEventHandler } from 'react';
import { AgentContext } from '../contexts/AgentProvider';
import { ToolsOptions } from './ToolsOptions';
import { useAnalytics } from '@backstage/core-plugin-api';

const useStyles = makeStyles<Theme & ThemeConfig>(theme => ({
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'start',
    gap: theme.spacing(1),
    padding: theme.spacing(1),
    marginTop: theme.spacing(2),
    backgroundColor:
      theme.palette.mode === 'light'
        ? theme.palette.background.paper
        : theme.palette.background.default,
    borderRadius: theme.shape.borderRadius * 5,
    boxShadow: theme.shadows[2],
    '&:focus-within': {
      outlineColor: theme.palette.primary.main,
      outlineWidth: 3,
      boxShadow: theme.shadows[5],
    },
  },
  input: {
    width: '100%',
    margin: 0,
    marginTop: theme.spacing(0.5),
    padding: 0,
    paddingInline: theme.spacing(1),
    fontSize: theme.typography.h5.fontSize,
  },
  submitButton: {
    marginLeft: 'auto',
    height: theme.spacing(4.5),
    width: theme.spacing(4.5),
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
    boxShadow: theme.shadows[2],
    '&:hover': {
      boxShadow: theme.shadows[5],
    },
  },
}));

export interface ChatInputProps {
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
}

export const ChatInput = ({ onChange }: ChatInputProps) => {
  const classes = useStyles();
  const theme = useTheme();
  const [text, setText] = useState<string>('');
  const { loading, submitQuery } = useContext(AgentContext);
  const analytics = useAnalytics();

  useEffect(() => {
    onChange?.(text);
  }, [onChange, text]);

  const handleSubmit: FormEventHandler = async event => {
    event.preventDefault();
    setText('');
    submitQuery(text);

    analytics.captureEvent('search', `assistant query submitted - ${text}`, {
      attributes: {
        query: text,
        length: text.length,
      }
    });
  };

  const handleKeyDown: KeyboardEventHandler = async event => {
    if (event.metaKey && event.code === "Enter") {
      handleSubmit(event);
    }
  }

  return (
    <Paper
      className={classes.inputGroup}
      component="form"
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
    >
      <InputBase
        required
        multiline
        maxRows={4}
        className={classes.input}
        placeholder="Send a message"
        inputProps={{ 'aria-label': 'send assistant a message' }}
        onChange={event => setText(event.target.value)}
        value={text}
      />
      <Box
        display="flex"
        alignItems="center"
        gridGap={theme.spacing(1)}
        width="100%"
      >
        <ToolsOptions />
        <Fab
          variant="circular"
          size="small"
          color="primary"
          type="submit"
          aria-label="submit"
          className={classes.submitButton}
          disabled={!Boolean(text) || loading}
        >
          <SendIcon fontSize="small" />
        </Fab>
      </Box>
    </Paper>
  );
};
