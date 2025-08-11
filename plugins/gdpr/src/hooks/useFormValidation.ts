import { useState, useCallback, useMemo } from 'react';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  custom?: (value: string) => string | null;
}

export interface ValidationRules {
  [fieldName: string]: ValidationRule;
}

export interface UseFormValidationReturn<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  isValid: boolean;
  isDirty: boolean;
  setValue: (name: keyof T, value: string) => void;
  setValues: (values: Partial<T>) => void;
  validateField: (name: keyof T) => boolean;
  validateAll: () => boolean;
  reset: () => void;
  getFieldProps: (name: keyof T) => {
    name: string;
    value: string;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    error?: string;
  };
}

/**
 * Custom hook for form validation with comprehensive validation rules
 */
export const useFormValidation = <T extends Record<string, string>>(
  initialValues: T,
  validationRules: ValidationRules = {},
): UseFormValidationReturn<T> => {
  const [values, setValuesState] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isDirty, setIsDirty] = useState(false);

  const validateValue = useCallback((fieldName: string, value: string): string | null => {
    const rules = validationRules[fieldName];
    if (!rules) return null;

    // Required validation
    if (rules.required && (!value || value.trim() === '')) {
      return `${fieldName} is required`;
    }

    // Skip other validations if field is empty and not required
    if (!value && !rules.required) {
      return null;
    }

    // Min length validation
    if (rules.minLength && value.length < rules.minLength) {
      return `${fieldName} must be at least ${rules.minLength} characters`;
    }

    // Max length validation
    if (rules.maxLength && value.length > rules.maxLength) {
      return `${fieldName} must not exceed ${rules.maxLength} characters`;
    }

    // Email validation
    if (rules.email) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(value)) {
        return 'Please enter a valid email address';
      }
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value)) {
      return `${fieldName} format is invalid`;
    }

    // Custom validation
    if (rules.custom) {
      const customError = rules.custom(value);
      if (customError) {
        return customError;
      }
    }

    return null;
  }, [validationRules]);

  const validateField = useCallback((name: keyof T): boolean => {
    const value = values[name];
    const error = validateValue(String(name), value);
    
    setErrors(prev => ({
      ...prev,
      [name]: error || undefined,
    }));

    return !error;
  }, [values, validateValue]);

  const validateAll = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    Object.keys(values).forEach(key => {
      const fieldName = key as keyof T;
      const error = validateValue(key, values[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validateValue]);

  const setValue = useCallback((name: keyof T, value: string) => {
    setValuesState(prev => ({ ...prev, [name]: value }));
    setIsDirty(true);
    
    // Validate field immediately on change
    setTimeout(() => validateField(name), 0);
  }, [validateField]);

  const setValues = useCallback((newValues: Partial<T>) => {
    setValuesState(prev => ({ ...prev, ...newValues }));
    setIsDirty(true);
  }, []);

  const reset = useCallback(() => {
    setValuesState(initialValues);
    setErrors({});
    setIsDirty(false);
  }, [initialValues]);

  const getFieldProps = useCallback((name: keyof T) => ({
    name: String(name),
    value: values[name],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      setValue(name, event.target.value);
    },
    error: errors[name],
  }), [values, errors, setValue]);

  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0 && 
           Object.values(errors).every(error => !error);
  }, [errors]);

  return {
    values,
    errors,
    isValid,
    isDirty,
    setValue,
    setValues,
    validateField,
    validateAll,
    reset,
    getFieldProps,
  };
};
