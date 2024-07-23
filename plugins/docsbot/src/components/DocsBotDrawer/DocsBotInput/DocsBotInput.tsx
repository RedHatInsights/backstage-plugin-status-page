import React, { useState } from 'react';
import { Button, Grid, TextField } from '@material-ui/core';

interface DocsBotbotInputProps {
  onSendMessage: (message: string) => void;
  isInputDisabled: boolean; // New disabled prop
  placeholder: string;
  isPanel: boolean;
}

const DocsBotbotInput: React.FC<DocsBotbotInputProps> = ({
  onSendMessage,
  isInputDisabled,
  placeholder,
  isPanel,
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleMessageSend = () => {
    onSendMessage(inputValue);
    setInputValue('');
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleMessageSend();
    }
  };

  return (
    <Grid container spacing={2} alignItems="center">
      <Grid item style={{ width: isPanel ? '70%' : '90%' }}>
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
          variant="contained"
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

export default DocsBotbotInput;
