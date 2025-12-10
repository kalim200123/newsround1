"use client";

import { RefObject } from "react";
import Image from "next/image";
import { Loader2, MessageSquareText, Trash2, Flag } from "lucide-react";
import MessageRenderer from "../MessageRenderer";
import { Message } from "@/lib/types/shared";
import { User } from "@/lib/types/user";
import { SearchResult } from "@/hooks/useChatSearch";
import { format } from "date-fns";

type MessageListProps = {
  messages: Message[];
  user: User | null;
  messagesEndRef: RefObject<HTMLDivElement>;
  messageRefs: RefObject<Map<number, HTMLDivElement>>;
  currentResultIndex: number;
  searchResults: SearchResult[];
  reportedMessageIds: Set<number>;
  onOpenConfirmation: (messageId: number) => void;
  onOpenReportModal: (messageId: number) => void;
  onZoomImage: (url: string) => void;
  onDownloadFile: (url: string, filename: string) => Promise<void>;
  isDownloadingUrl: string | null;
  searchQuery: string;
  isLoadingHistory: boolean;
};

const formatTimestamp = (dateString: string) => {
  try {
    return format(new Date(dateString), "a h:mm");
  } catch {
    return "--:--";
  }
};

export default function MessageList({
  messages,
  user,
  messagesEndRef,
  messageRefs,
  currentResultIndex,
  searchResults,
  reportedMessageIds,
  onOpenConfirmation,
  onOpenReportModal,
  onZoomImage,
  onDownloadFile,
  isDownloadingUrl,
  searchQuery,
  isLoadingHistory,
}: MessageListProps) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
      {isLoadingHistory ? (
        <div className="flex justify-center items-center h-full text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="ml-3 text-lg">채팅 기록을 불러오는 중...</p>
        </div>
      ) : (
        <>
          {messages.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-full text-muted-foreground">
              <MessageSquareText size={48} />
              <p className="mt-4 text-lg font-semibold">지금 첫 번째 메시지를 보내세요!</p>
              <p>새로운 대화를 시작해보세요!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMyMessage = user ? msg.author === (user.nickname || user.name) : false;
              const activeResult =
                currentResultIndex >= 0 && searchResults[currentResultIndex]?.messageId === msg.id
                  ? searchResults[currentResultIndex]
                  : null;
              const isMessageReported = reportedMessageIds.has(msg.id);

              return (
                <div
                  key={msg.id}
                  ref={(el) => {
                    if (el) messageRefs.current.set(msg.id, el);
                    else messageRefs.current.delete(msg.id);
                  }}
                  data-message-id={msg.id}
                >
                  {isMyMessage ? (
                    <div className="group flex justify-end animate-fade-in-up">
                      <div className="flex items-end gap-1">
                        {msg.message !== "메시지가 삭제되었습니다." && (
                          <div className="flex items-center self-end shrink-0">
                            <button
                              onClick={() => onOpenConfirmation(msg.id)}
                              className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-full opacity-0 group-hover:opacity-100"
                              title="메시지 삭제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        <div className="text-sm min-w-0 w-full">
                          {msg.isHidden ? (
                            <span className="italic text-primary-foreground/70">숨겨진 메시지입니다.</span>
                          ) : (
                            <MessageRenderer
                              msg={msg}
                              onZoom={onZoomImage}
                              onDownload={onDownloadFile}
                              isDownloadingUrl={isDownloadingUrl}
                              searchResult={activeResult}
                              searchQuery={searchQuery}
                              isMyMessage={true}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="group flex gap-2.5 animate-fade-in-up">
                      <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border-2 border-white bg-white mt-1">
                        <Image
                          src={msg.profile_image_url!}
                          alt={`${msg.author}'s profile`}
                          fill
                          className="rounded-full object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm text-muted-foreground font-medium">{msg.author}</span>
                        <div className="flex items-end gap-1">
                          <div className="text-sm min-w-0 w-full">
                            {msg.isHidden ? (
                              <span className="italic text-muted-foreground">숨겨진 메시지입니다.</span>
                            ) : (
                              <MessageRenderer
                                msg={msg}
                                onZoom={onZoomImage}
                                onDownload={onDownloadFile}
                                isDownloadingUrl={isDownloadingUrl}
                                searchResult={activeResult}
                                searchQuery={searchQuery}
                                isMyMessage={false}
                              />
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {formatTimestamp(msg.created_at)}
                          </span>
                          {msg.message !== "메시지가 삭제되었습니다." && (
                            <div className="flex items-center self-end shrink-0">
                              <button
                                onClick={() => onOpenReportModal(msg.id)}
                                className="text-muted-foreground hover:text-yellow-500 transition-colors p-1 rounded-full opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="메시지 신고"
                                disabled={isMessageReported}
                              >
                                <Flag className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
}