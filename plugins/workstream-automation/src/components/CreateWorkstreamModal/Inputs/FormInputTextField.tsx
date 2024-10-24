import TextField, { TextFieldProps } from '@material-ui/core/TextField';
import React from 'react';
import { Controller, RegisterOptions, useFormContext } from 'react-hook-form';

export const FormInputTextField = (props: {
  label: string;
  name: string;
  placeholder: string;
  rules?: RegisterOptions;
  textFieldProps?: TextFieldProps;
}) => {
  const { label, rules, name, placeholder, textFieldProps } = props;
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState: { error } }) => {
        const { value, onChange, onBlur } = field;
        return (
          <TextField
            {...textFieldProps}
            fullWidth
            variant="outlined"
            label={label}
            placeholder={placeholder}
            required={!!rules?.required}
            error={!!error}
            helperText={error ? error.message : textFieldProps?.helperText}
            onBlur={onBlur}
            onChange={e => onChange(e.target.value)}
            value={value ?? ''}
          />
        );
      }}
    />
  );
};
