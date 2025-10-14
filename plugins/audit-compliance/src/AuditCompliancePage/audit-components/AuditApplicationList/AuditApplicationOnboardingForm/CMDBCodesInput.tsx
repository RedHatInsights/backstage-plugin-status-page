import { Chip, TextField } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import { useState } from 'react';

interface CMDBCodesInputProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export const CMDBCodesInput = ({
  value,
  onChange,
  required = false,
}: CMDBCodesInputProps) => {
  const [inputValue, setInputValue] = useState('');

  // Parse comma-separated string into array
  const cmdbCodes = value
    ? value
        .split(',')
        .map(code => code.trim())
        .filter(code => code)
    : [];

  const handleAddCode = (code: string) => {
    const trimmedCode = code.trim();
    if (trimmedCode && !cmdbCodes.includes(trimmedCode)) {
      const newCodes = [...cmdbCodes, trimmedCode];
      onChange(newCodes.join(', '));
    }
    setInputValue('');
  };

  const handleRemoveCode = (codeToRemove: string) => {
    const newCodes = cmdbCodes.filter(code => code !== codeToRemove);
    onChange(newCodes.join(', '));
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      if (inputValue.trim()) {
        handleAddCode(inputValue);
      }
    }
  };

  return (
    <div>
      <TextField
        label=""
        fullWidth
        required={required}
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Type CMDB code and press Enter or comma"
        helperText="Press Enter or comma to add a code"
        error={required && cmdbCodes.length === 0}
      />
      {cmdbCodes.length > 0 && (
        <div
          style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}
        >
          {cmdbCodes.map((code, index) => (
            <Chip
              key={index}
              label={code}
              onDelete={() => handleRemoveCode(code)}
              deleteIcon={<CloseIcon />}
              color="primary"
              variant="outlined"
            />
          ))}
        </div>
      )}
    </div>
  );
};

