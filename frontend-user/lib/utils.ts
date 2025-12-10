import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { BACKEND_BASE_URL } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Takes a potentially relative URL from the backend and resolves it to a full URL.
 * Also handles incorrect '/public' prefixes from the API.
 * @param url The URL string from the API.
 * @returns A full, usable URL for an image source.
 */
export const getFullImageUrl = (url?: string): string => {
  if (!url) return "/user-placeholder.svg";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/public/")) {
    return url.substring("/public".length);
  }
  return `${BACKEND_BASE_URL}${url}`;
};

/**
 * ISO 8601 형식의 날짜 문자열을 상대 시간(예: "1시간 전")으로 변환하는 함수
 * @param dateString - ISO 8601 형식의 날짜 문자열 (예: "2025-10-27T05:00:00.000Z")
 * @returns 변환된 상대 시간 문자열
 */
export function formatRelativeTime(dateString: string): string {
  // Normalize the date string to ensure it's parsed as UTC.
  // The backend provides some dates with 'Z' and some without.
  // 'YYYY-MM-DD HH:mm:ss' should be treated as UTC.
  const normalizedDateString = dateString.includes("T") ? dateString : dateString.replace(" ", "T") + "Z";
  const date = new Date(normalizedDateString);
  const now = new Date();

  // getTime() returns UTC milliseconds for both dates, so the difference is correct without manual offsets.
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInSeconds < 5) {
    return "방금 전";
  }
  if (diffInSeconds < 60) {
    return `${diffInSeconds}초 전`;
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`;
  } else if (diffInHours < 24) {
    return `${diffInHours}시간 전`;
  } else if (diffInDays === 1) {
    return "어제";
  } else {
    // For older dates, display the KST date correctly using Timezone option.
    return date.toLocaleDateString("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }
}
