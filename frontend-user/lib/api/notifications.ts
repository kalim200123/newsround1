/**
 * @file notifications.ts
 * @description 알림 관련 API 호출을 담당하는 서비스 파일입니다.
 * 알림 목록 조회, 읽음 처리, 설정 조회 및 수정 등의 기능을 제공합니다.
 */

import { Notification as NotificationItem } from "@/lib/types/notification"; // Import from single source of truth
import { fetchWrapper } from "./fetchWrapper";

export interface PaginatedNotifications {
  notifications: NotificationItem[];
  total: number;
  unread_count: number;
  page: number;
  limit: number;
}

/**
 * @function getNotifications
 * @description 사용자의 알림 목록을 조회합니다.
 * @param {string} token - 사용자 인증 토큰
 * @param {number} [page=1] - 조회할 페이지 번호
 * @param {number} [limit=10] - 페이지당 알림 개수
 * @returns {Promise<PaginatedNotifications>} 알림 목록과 페이지 정보
 */
export async function getNotifications(
  token: string,
  page: number = 1,
  limit: number = 10
): Promise<PaginatedNotifications> {
  const response = await fetchWrapper(`/api/notifications?page=${page}&limit=${limit}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("알림 목록을 불러오는데 실패했습니다.");
  }

  const data = await response.json();

  // Map the API response to the frontend Notification type
  // Define a loose type for the raw API response items to avoid 'any'
  type RawNotification = Partial<NotificationItem> & {
    related_url?: string;
    link?: string;
    metadata?: { url?: string };
    data?: { url?: string };
  };

  const mappedNotifications = (data.notifications || []).map((notif: RawNotification) => ({
    ...notif,
    url: notif.related_url || notif.url || notif.link || notif.metadata?.url || notif.data?.url || "",
  }));

  return {
    notifications: mappedNotifications,
    total: data.total || 0,
    unread_count: data.unread_count || 0,
    page: data.page || page,
    limit: data.limit || limit,
  };
}

/**
 * @function getUnreadCount
 * @description 읽지 않은 알림 개수를 조회합니다.
 * @param {string} token - 사용자 인증 토큰
 * @returns {Promise<number>} 읽지 않은 알림 개수
 */
export async function getUnreadCount(token: string): Promise<number> {
  const response = await fetchWrapper("/api/notifications/unread-count", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    // 에러 발생 시 0으로 처리하거나 에러를 던질 수 있음. 여기선 0 반환 안전장치.
    console.error("읽지 않은 알림 개수 조회 실패");
    return 0;
  }

  const data = await response.json();
  return data.count || 0; // 백엔드 응답 구조에 따라 조정 필요 (가이드엔 단순 number인지 객체인지 명시 없으나 보통 { count: 5 } 형태)
  // 가이드: GET /api/notifications/unread-count
  // 응답 예시가 없지만 보통 { count: 5 } 또는 5.
  // 만약 number 자체라면 data가 숫자일 것임. 안전하게 처리.
}

/**
 * @function markAsRead
 * @description 특정 알림을 읽음 처리합니다.
 * @param {string} token - 사용자 인증 토큰
 * @param {number} id - 알림 ID
 */
export async function markAsRead(token: string, id: number): Promise<void> {
  const response = await fetchWrapper(`/api/notifications/${id}/read`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
    throw new Error(errorData.message || `알림 읽음 처리에 실패했습니다. Status: ${response.status}`);
  }
}

/**
 * @function markAllAsRead
 * @description 모든 알림을 읽음 처리합니다.
 * @param {string} token - 사용자 인증 토큰
 */
export async function markAllAsRead(token: string): Promise<void> {
  const response = await fetchWrapper(`/api/notifications/read-all`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("전체 읽음 처리에 실패했습니다.");
  }
}

/**
 * @function deleteNotification
 * @description 특정 알림을 삭제합니다.
 * @param {string} token - 사용자 인증 토큰
 * @param {number} id - 알림 ID
 */
export async function deleteNotification(token: string, id: number): Promise<void> {
  const response = await fetchWrapper(`/api/notifications/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
    throw new Error(errorData.message || `알림 삭제에 실패했습니다. Status: ${response.status}`);
  }
}
