"use client";

interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  color?: string;
}

export default function LoadingSpinner({ size = "medium", color = "border-blue-500" }: LoadingSpinnerProps) {
  let spinnerSize = "w-8 h-8";
  let borderWidth = "border-4";

  switch (size) {
    case "small":
      spinnerSize = "w-4 h-4";
      borderWidth = "border-2";
      break;
    case "medium":
      spinnerSize = "w-8 h-8";
      borderWidth = "border-4";
      break;
    case "large":
      spinnerSize = "w-12 h-12";
      borderWidth = "border-4";
      break;
  }

  return (
    <div className={`inline-block ${spinnerSize} ${borderWidth} ${color} border-solid rounded-full animate-spin border-t-transparent`}>
      <span className="sr-only">Loading...</span>
    </div>
  );
}
