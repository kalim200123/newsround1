'use client';

interface ConfirmationPopoverProps {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmationPopover({ 
  title, 
  message, 
  confirmText, 
  cancelText, 
  onConfirm, 
  onCancel 
}: ConfirmationPopoverProps) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50" // Use fixed for full screen centering
    >
      <div 
        className="w-64 bg-popover border border-border rounded-lg shadow-lg p-4"
      >
        <h4 className="text-white text-md font-semibold mb-2">{title}</h4>
        <p className="text-muted-foreground text-sm mb-4">{message}</p>
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onCancel}
            className="px-3 py-1 text-sm rounded-md text-foreground bg-muted hover:bg-muted"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1 text-sm rounded-md text-white bg-red-600 hover:bg-red-500"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}