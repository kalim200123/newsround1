import { SearchResult } from "@/hooks/useChatSearch";
import { getTopicDetail } from "@/lib/api/topics";
import { MEDIA_EXTENSIONS, S3_URL_PREFIX } from "@/lib/constants";
import { Message } from "@/lib/types/shared";
import { TopicPreview } from "@/lib/types/topic";
import { useTheme } from "next-themes";
import React, { useEffect, useState } from "react";
import ArticleEmbedCard from "./chat/ArticleEmbedCard";
import TopicEmbedCard from "./chat/TopicEmbedCard"; // Use TopicEmbedCard instead of TopicPreviewCard
import MediaRenderer from "./common/MediaRenderer";
import UrlRenderer from "./common/UrlRenderer";

interface MessageRendererProps {
  msg: Message;
  onZoom: (url: string) => void;
  onDownload: (url: string, filename: string) => Promise<void>;
  isDownloadingUrl: string | null;
  searchResult: SearchResult | null;
  searchQuery: string;
  isMyMessage: boolean; // Added
}

function highlightText(text: string, query: string, searchResult: SearchResult | null) {
  if (!query || text.trim() === "") return text;

  const escapedQuery = query.replace(/[.*+?^${}()|[\\]/g, "\\$& ");
  const regex = new RegExp(escapedQuery, "gi");
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let matchCount = 0; // To keep track of the current match index

  text.replace(regex, (match, index) => {
    if (index > lastIndex) {
      parts.push(text.substring(lastIndex, index));
    }
    if (searchResult && matchCount === searchResult.matchIndex) {
      parts.push(
        <mark key={`mark-${index}`} className="bg-yellow-400 text-black rounded px-0.5">
          {match}
        </mark>
      );
    } else {
      parts.push(match); // Render non-highlighted match if not the target
    }
    matchCount++;
    lastIndex = index + match.length;
    return match;
  });

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return <>{parts}</>;
}

export default function MessageRenderer({
  msg,
  onZoom,
  onDownload,
  isDownloadingUrl,
  searchResult,
  searchQuery,
  isMyMessage,
}: MessageRendererProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const trimmedMessage = msg.message.trim();

  const [clientResolvedTopic, setClientResolvedTopic] = useState<TopicPreview | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    // Reset state when inputs change
    if (msg.topic_preview || msg.article_preview) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (clientResolvedTopic !== null) setClientResolvedTopic(null);
      if (fetchError !== null) setFetchError(null);
      return;
    }

    // Regex to match internal debate URLs, supporting both full and relative paths
    const match = trimmedMessage.match(/^(https?:\/\/[^\s]+\/debate\/(\d+))|^\/debate\/(\d+)$/);

    if (!match) {
      if (clientResolvedTopic !== null) setClientResolvedTopic(null);
      if (fetchError !== null) setFetchError(null);
      return;
    }

    const topicId = match[2] || match[3];
    if (topicId) {
      // Avoid re-fetching if we are already displaying the correct topic
      // (Optional optimization, but strictly we just want to clear old state if needed)
      // Logic: If topicId changed, we fetch.
      // We set state to null to show loading? or just wait?
      // Setting to null causes flash. Let's just fetch.
      // But we need to handle race conditions implicitly by simple replacement.

      const fetchClientTopic = async () => {
        try {
          const topicData = await getTopicDetail(topicId);
          const topic = topicData.topic;

          const constructedTopicPreview: TopicPreview = {
            id: topic.id,
            display_name: topic.display_name,
            status: topic.collection_status || "ACTIVE",
            left_count: topic.vote_count_left || 0,
            right_count: topic.vote_count_right || 0,
            vote_remaining_time: null,
            vote_start_at: topic.vote_start_at, // Map start date
            vote_end_at: topic.vote_end_at, // Map end date
          };
          setClientResolvedTopic(constructedTopicPreview);
          setFetchError(null);
        } catch {
          setClientResolvedTopic(null);
          setFetchError(`ID: ${topicId}`);
        }
      };

      fetchClientTopic();
    }
  }, [trimmedMessage, msg.topic_preview, msg.article_preview, clientResolvedTopic, fetchError]);

  // --- 1. Handle media-only messages (these don't have text + card) ---
  const isBareMediaFilename =
    !trimmedMessage.startsWith("http") &&
    !trimmedMessage.includes("/") &&
    MEDIA_EXTENSIONS.some((ext) => trimmedMessage.toLowerCase().endsWith(ext));

  if (isBareMediaFilename) {
    const fullUrl = S3_URL_PREFIX + trimmedMessage.replace(/ /g, "%20");
    return (
      <MediaRenderer
        url={fullUrl}
        onZoom={onZoom}
        onDownload={onDownload}
        isDownloading={isDownloadingUrl === fullUrl}
      />
    );
  }

  let isMediaUrl = false;
  try {
    const parsedUrl = new URL(trimmedMessage);
    if (
      trimmedMessage.startsWith(S3_URL_PREFIX) ||
      MEDIA_EXTENSIONS.some((ext) => parsedUrl.pathname.toLowerCase().endsWith(ext))
    ) {
      isMediaUrl = true;
    }
  } catch {
    /* Not a valid URL format */
  }

  if (isMediaUrl) {
    return (
      <MediaRenderer
        url={trimmedMessage}
        onZoom={onZoom}
        onDownload={onDownload}
        isDownloading={isDownloadingUrl === trimmedMessage}
      />
    );
  }

  // --- 2. For all other messages, prepare for combined rendering ---

  // Helper to determine if we should try a client-side render for a plain URL.
  const getClientRenderUrl = (): string | null => {
    // Don't render if a backend preview already exists
    // Also don't render if clientResolvedTopic is available (as it will be rendered separately)
    if (msg.topic_preview || msg.article_preview || clientResolvedTopic) return null;

    const urlRegex = /^(https?:\/\/[^\s]+)$/;
    if (urlRegex.test(trimmedMessage)) {
      try {
        const url = new URL(trimmedMessage);
        // Only render for external URLs, not our internal debate URLs (which clientResolvedTopic handles)
        if (
          !url.hostname.endsWith("vercel.app") &&
          !["localhost", "127.0.0.1"].includes(url.hostname) &&
          !url.pathname.startsWith("/debate/")
        ) {
          return trimmedMessage;
        }
      } catch {
        return null;
      }
    }
    return null;
  };

  const clientRenderUrl = getClientRenderUrl();

  // Determine the URL that a preview card would represent, if any.
  let urlFromPreview: string | null = null;
  if (msg.topic_preview) {
    urlFromPreview = `/debate/${msg.topic_preview.id}`;
    // Convert relative debate paths to absolute for consistent comparison
    if (typeof window !== "undefined" && urlFromPreview.startsWith("/debate/")) {
      urlFromPreview = window.location.origin + urlFromPreview;
    }
  } else if (msg.article_preview) {
    urlFromPreview = msg.article_preview.url;
  } else if (clientRenderUrl) {
    urlFromPreview = clientRenderUrl;
  } else if (clientResolvedTopic) {
    urlFromPreview = `/debate/${clientResolvedTopic.id}`;
    // Convert relative debate paths to absolute for consistent comparison
    if (typeof window !== "undefined" && urlFromPreview.startsWith("/debate/")) {
      urlFromPreview = window.location.origin + urlFromPreview;
    }
  }

  // Regex to extract the URL from a Markdown link [text](url)
  const markdownLinkRegex = /^\[.*?\]\((https?:\/\/[^\s]+)\)$/;
  const markdownMatch = trimmedMessage.match(markdownLinkRegex);
  const urlFromMarkdownLink = markdownMatch ? markdownMatch[1] : null;

  // Normalize URLs for comparison (handle relative vs absolute)
  const normalizeUrl = (url: string | null) => {
    if (!url) return null;
    try {
      // If it's already absolute, return it
      new URL(url);
      return url;
    } catch {
      // If relative, prepend origin to make it absolute for comparison
      if (typeof window !== "undefined" && url.startsWith("/")) {
        return window.location.origin + url;
      }
      return url;
    }
  };

  const normalizedMessage = normalizeUrl(trimmedMessage);
  const normalizedPreviewUrl = normalizeUrl(urlFromPreview);
  const normalizedMarkdownUrl = normalizeUrl(urlFromMarkdownLink);

  // Show the text bubble only if:
  // 1. There's no preview URL (no card is being shown for the message)
  // 2. The trimmed message is not identical to the URL being previewed (normalized)
  // 3. The trimmed message is not a Markdown link whose URL is being previewed
  const showTextBubble =
    trimmedMessage &&
    (!urlFromPreview || (normalizedMessage !== normalizedPreviewUrl && normalizedMarkdownUrl !== normalizedPreviewUrl));

  const bubbleClass = isMyMessage
    ? "bg-blue-500 text-white rounded-2xl shadow-sm"
    : `text-foreground rounded-2xl shadow-sm ${isDarkMode ? "bg-zinc-700" : "bg-gray-300"}`;

  return (
    <>
      {/* Part 1: Render the text bubble if applicable */}
      {showTextBubble && (
        <div className={`px-4 py-2 shadow-sm max-w-[280px] sm:max-w-sm wrap-break-word ${bubbleClass}`}>
          {highlightText(trimmedMessage, searchQuery, searchResult)}
        </div>
      )}

      {/* Part 2: Render backend-provided previews */}
      {msg.topic_preview && <TopicEmbedCard topic={msg.topic_preview} />}

      {msg.article_preview && (
        <div className="mt-1 max-w-[280px]">
          <ArticleEmbedCard article={msg.article_preview} />
        </div>
      )}
      {/* Part 3: Render client-side resolved topic preview */}
      {clientResolvedTopic &&
        !msg.topic_preview && ( // Only render if not already from backend
          <TopicEmbedCard topic={clientResolvedTopic} />
        )}

      {/* Part 4: Render client-side external URL preview if no other preview exists */}
      {clientRenderUrl && <UrlRenderer url={clientRenderUrl} />}
    </>
  );
}
