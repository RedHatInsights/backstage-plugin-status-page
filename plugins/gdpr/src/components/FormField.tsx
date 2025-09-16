import { FC, ChangeEvent } from 'react';
import {
  TextField,
  FormControl,
  FormHelperText,
  Box,
  Typography,
} from '@material-ui/core';

export interface FormFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  type?: 'text' | 'email' | 'password' | 'number';
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  variant?: 'outlined' | 'filled' | 'standard';
  fullWidth?: boolean;
}

/**
 * Enhanced form field component with built-in validation and consistent styling
 */
export const FormField: FC<FormFieldProps> = ({
  label,
  name,
  value,
  onChange,
  error,
  helperText,
  required = false,
  disabled = false,
  type = 'text',
  placeholder,
  multiline = false,
  rows = 1,
  maxLength,
  variant = 'outlined',
  fullWidth = true,
}) => {
  const hasError = Boolean(error);
  const displayHelperText = error || helperText;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { value: inputValue } = event.target;
    
    // Apply maxLength constraint
    if (maxLength && inputValue.length > maxLength) {
      return;
    }
    
    onChange(event);
  };

  return (
    <FormControl fullWidth={fullWidth} error={hasError}>
      <TextField
        label={label}
        name={name}
        value={value}
        onChange={handleChange}
        error={hasError}
        required={required}
        disabled={disabled}
        type={type}
        placeholder={placeholder}
        variant={variant}
        multiline={multiline}
        rows={multiline ? rows : undefined}
        fullWidth={fullWidth}
        inputProps={{
          maxLength,
        }}
      />
      
      {displayHelperText && (
        <FormHelperText>
          {displayHelperText}
        </FormHelperText>
      )}
      
      {maxLength && (
        <Box display="flex" justifyContent="flex-end" mt={0.5}>
          <Typography 
            variant="caption" 
            color={value.length > maxLength * 0.9 ? 'error' : 'textSecondary'}
          >
            {value.length}/{maxLength}
          </Typography>
        </Box>
      )}
    </FormControl>
  );
};
