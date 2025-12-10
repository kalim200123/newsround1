import { useState, useEffect, useRef, RefObject } from 'react';
import { Message } from '../lib/types/shared';

export interface SearchResult {
  messageId: number;
  matchIndex: number; // Index of the specific match within the message content
  charIndex: number; // Starting character index of the match within the message content
  isTitleMatch: boolean; // True if the match is in an article/topic title
}

export const useChatSearch = (messages: Message[], messageRefs: RefObject<Map<number, HTMLDivElement>>) => {
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(-1);

  const scrollIntoViewRef = useRef<number | null>(null);

  // Effect to perform search when messages or query change
  useEffect(() => {
    if (!searchQuery) {
      setTimeout(() => {
        setSearchResults([]);
        setCurrentResultIndex(-1);
      }, 0);
      return;
    }

    const queryLower = searchQuery.toLowerCase();
    const results: SearchResult[] = [];

    messages.forEach((msg) => {
      // Search in message content
      const messageContent = msg.message.toLowerCase();
      let lastIndex = 0;
      let matchCount = 0;
      while (lastIndex < messageContent.length) {
        const index = messageContent.indexOf(queryLower, lastIndex);
        if (index === -1) break;
        results.push({
          messageId: msg.id,
          matchIndex: matchCount++,
          charIndex: index,
          isTitleMatch: false,
        });
        lastIndex = index + queryLower.length;
      }

      // Search in article preview title
      if (msg.article_preview && msg.article_preview.title) {
        const articleTitle = msg.article_preview.title.toLowerCase();
        let lastIndex = 0;
        let matchCount = 0;
        while (lastIndex < articleTitle.length) {
          const index = articleTitle.indexOf(queryLower, lastIndex);
          if (index === -1) break;
          results.push({
            messageId: msg.id,
            matchIndex: matchCount++,
            charIndex: index,
            isTitleMatch: true,
          });
          lastIndex = index + queryLower.length;
        }
      }

      // Search in topic preview title
      if (msg.topic_preview && msg.topic_preview.display_name) {
        const topicTitle = msg.topic_preview.display_name.toLowerCase();
        let lastIndex = 0;
        let matchCount = 0;
        while (lastIndex < topicTitle.length) {
          const index = topicTitle.indexOf(queryLower, lastIndex);
          if (index === -1) break;
          results.push({
            messageId: msg.id,
            matchIndex: matchCount++,
            charIndex: index,
            isTitleMatch: true,
          });
          lastIndex = index + queryLower.length;
        }
      }
    });

    setTimeout(() => {
      setSearchResults(results);
      setCurrentResultIndex(results.length > 0 ? 0 : -1);
    }, 0);
    scrollIntoViewRef.current = results.length > 0 ? results[0].messageId : null;
  }, [messages, searchQuery]);

  // Effect to scroll to the current search result
  useEffect(() => {
    if (searchResults.length > 0 && currentResultIndex !== -1) {
      const targetMessageId = searchResults[currentResultIndex].messageId;
      const messageElement = messageRefs.current?.get(targetMessageId);
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [searchResults, currentResultIndex, messageRefs]);

  const handleNavigateResult = (direction: 'next' | 'prev') => {
    if (searchResults.length === 0) return;

    let newIndex = currentResultIndex;
    if (direction === 'next') {
      newIndex = (currentResultIndex + 1) % searchResults.length;
    } else {
      newIndex = (currentResultIndex - 1 + searchResults.length) % searchResults.length;
    }
    setCurrentResultIndex(newIndex);
  };

  const closeSearch = () => {
    setIsSearchVisible(false);
    setSearchQuery('');
    setSearchResults([]);
    setCurrentResultIndex(-1);
  };

  return {
    isSearchVisible,
    setIsSearchVisible,
    searchQuery,
    setSearchQuery,
    searchResults,
    currentResultIndex,
    handleNavigateResult,
    closeSearch,
  };
};
