export const BACKEND_BASE_URL = "http://localhost:3001";

// A map of known favicon URLs for specific news sources.
// Can be populated over time.
export const FAVICON_URLS: { [key: string]: string } = {
  "ohmynews.com": "https://media.livere.org/uploads/8tjwRfX43js4Y6D5pyIs_ohmy.png",
};

// A function to generate a fallback favicon URL using a generic service.
export const DEFAULT_FAVICON_URL = (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;

// Chat-related constants
export const S3_URL_PREFIX = "https://news-upload-rsteam.s3.ap-northeast-2.amazonaws.com/chats/";
export const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".avif"];
export const VIDEO_EXTENSIONS = [".mp4", ".webm", ".ogg"];
export const MEDIA_EXTENSIONS = [...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS];
