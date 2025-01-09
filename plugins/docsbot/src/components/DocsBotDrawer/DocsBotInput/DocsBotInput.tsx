import { useAnalytics } from '@backstage/core-plugin-api';
import { Button, Grid, TextField } from '@material-ui/core';
import React, { useState } from 'react';

interface DocsBotInputProps {
  onSendMessage: (message: string) => void;
  isInputDisabled: boolean; // New disabled prop
  placeholder: string;
}

const DocsBotInput: React.FC<DocsBotInputProps> = ({
  onSendMessage,
  isInputDisabled,
  placeholder,
}) => {
  const [inputValue, setInputValue] = useState('');
  const analytics = useAnalytics();
  const handleMessageSend = () => {
    onSendMessage(inputValue);
    setInputValue('');
    analytics.captureEvent('click', `Docsbot query asked`);
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleMessageSend();
    }
  };

  return (
    <Grid container spacing={1} alignItems="center">
      <Grid item xs>
        <TextField
          variant="outlined"
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder={placeholder}
          onKeyPress={handleKeyPress}
          disabled={isInputDisabled}
          fullWidth
        />
      </Grid>
      <Grid item>
        <Button
          style={{ padding: '14px' }}
          variant="contained"
          disableElevation
          color="primary"
          onClick={handleMessageSend}
          disabled={isInputDisabled}
        >
          Send
        </Button>
      </Grid>
    </Grid>
  );
};

export default DocsBotInput;
