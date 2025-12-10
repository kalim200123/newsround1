"use client";

interface ErrorMessageProps {
  message: string;
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md" role="alert">
      <p className="font-bold">오류:</p>
      <p>{message}</p>
    </div>
  );
}
