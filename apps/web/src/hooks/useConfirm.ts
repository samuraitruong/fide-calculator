import { useState } from 'react';

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
}

export const useConfirm = () => {
  const [state, setState] = useState<ConfirmState>({
    isOpen: false,
    title: '',
    message: '',
  });

  const openConfirm = (title: string, message: string) => {
    setState({
      isOpen: true,
      title,
      message,
    });
  };

  const closeConfirm = () => {
    setState(prev => ({
      ...prev,
      isOpen: false,
    }));
  };

  const handleConfirm = (onConfirm: () => void) => {
    onConfirm();
    closeConfirm();
  };

  const handleCancel = (onCancel: () => void) => {
    onCancel();
    closeConfirm();
  };

  return {
    ...state,
    openConfirm,
    closeConfirm,
    handleConfirm,
    handleCancel,
  };
}; 