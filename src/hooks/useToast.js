import { useContext } from 'react';

import { ToastContext } from '../context/toast-context';

export default function useToast() {
  const context = useContext(ToastContext);

  if (context === null) {
    throw new Error('useToast must be used inside a <ToastProvider>.');
  }

  return context;
}
