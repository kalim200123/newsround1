'use client';

import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  children: React.ReactNode;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  confirmText = '확인',
  cancelText = '취소',
  isLoading = false,
  children,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
      <div className="w-full max-w-md p-6 bg-card border border-border rounded-xl shadow-lg transform transition-all">
        <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
        <div className="text-foreground mb-6">{children}</div>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-foreground bg-muted rounded-lg hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-red-800 disabled:cursor-not-allowed"
          >
            {isLoading ? '처리 중...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
