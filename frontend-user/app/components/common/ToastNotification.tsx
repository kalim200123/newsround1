'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  onDismiss: (id: string) => void;
}

const icons = {
  success: <CheckCircle className="w-6 h-6 text-green-500" />,
  error: <AlertTriangle className="w-6 h-6 text-red-500" />,
  info: <Info className="w-6 h-6 text-blue-500" />,
};

const ToastNotification = ({ id, message, type, duration = 5000, onDismiss }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      // Wait for exit animation to complete before removing the toast from the DOM
      const animationDuration = 300;
      setTimeout(() => onDismiss(id), animationDuration);
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, [id, duration, onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    const animationDuration = 300;
    setTimeout(() => onDismiss(id), animationDuration);
  };

  // Dynamically select animation class based on visibility state
  const animationClass = isVisible ? 'animate-toast-in' : 'animate-toast-out';

  return (
    <div
      className={`relative flex items-center p-4 w-full max-w-sm bg-card text-foreground rounded-lg shadow-lg border border-border overflow-hidden ${animationClass}`}
      role="alert"
    >
      <div className="shrink-0">{icons[type]}</div>
      <div className="ml-3 text-sm font-normal flex-1">{message}</div>
      <button
        onClick={handleDismiss}
        className="ml-4 -mx-1.5 -my-1.5 bg-muted text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg focus:ring-2 focus:ring-ring p-1.5 inline-flex items-center justify-center h-8 w-8"
        aria-label="Close"
      >
        <span className="sr-only">Close</span>
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

export default ToastNotification;
