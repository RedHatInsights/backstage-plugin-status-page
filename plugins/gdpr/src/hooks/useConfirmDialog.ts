import { useState, useCallback } from 'react';

export interface ConfirmDialogState {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'secondary' | 'default';
  severity?: 'info' | 'warning' | 'error';
  onConfirm?: () => void;
}

export interface UseConfirmDialogReturn {
  dialogState: ConfirmDialogState;
  isLoading: boolean;
  showConfirmDialog: (options: Omit<ConfirmDialogState, 'open'>) => void;
  handleConfirm: () => void;
  handleCancel: () => void;
  setLoading: (loading: boolean) => void;
}

/**
 * Custom hook for managing confirmation dialog state
 */
export const useConfirmDialog = (): UseConfirmDialogReturn => {
  const [dialogState, setDialogState] = useState<ConfirmDialogState>({
    open: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    confirmColor: 'primary',
    severity: 'warning',
  });
  
  const [isLoading, setIsLoading] = useState(false);

  const showConfirmDialog = useCallback((options: Omit<ConfirmDialogState, 'open'>) => {
    setDialogState({
      open: true,
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      confirmColor: 'primary',
      severity: 'warning',
      ...options,
    });
    setIsLoading(false);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (dialogState.onConfirm) {
      setIsLoading(true);
      try {
        await dialogState.onConfirm();
      } finally {
        setIsLoading(false);
        setDialogState(prev => ({ ...prev, open: false }));
      }
    }
  }, [dialogState]);

  const handleCancel = useCallback(() => {
    if (!isLoading) {
      setDialogState(prev => ({ ...prev, open: false }));
    }
  }, [isLoading]);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  return {
    dialogState,
    isLoading,
    showConfirmDialog,
    handleConfirm,
    handleCancel,
    setLoading,
  };
};
