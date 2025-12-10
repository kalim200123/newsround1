"use client";

import { formatRelativeTime } from "@/lib/utils"; // Import the correct function
import { format } from "date-fns"; // Import date-fns format

interface ClientOnlyTimeProps {
  date: string;
  format?: string; // Add optional format prop
  className?: string;
}

export default function ClientOnlyTime({ date, format: formatStr, className }: ClientOnlyTimeProps) {
  // To ensure the datetime attribute is a valid ISO string
  const getIsoString = (utcString: string) => {
    try {
      const utcDate = new Date(utcString.includes("T") ? utcString : utcString.replace(" ", "T") + "Z");
      return utcDate.toISOString();
    } catch {
      return utcString; // Fallback
    }
  };

  const dateObj = new Date(date);
  const displayTime = formatStr ? format(dateObj, formatStr) : formatRelativeTime(date);

  // After mounting on the client, render the relative time or formatted time
  return (
    <time dateTime={getIsoString(date)} className={className}>
      {displayTime}
    </time>
  );
}
