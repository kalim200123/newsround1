/**
 * API에서 받아오는 사용자(User) 데이터 구조 정의
 */
export interface User {
  id: number;
  email: string;
  name: string;
  nickname?: string;
  phone?: string;
  profile_image_url?: string; // Changed to match API
  introduction?: string;
}

// 👇 프로필 업데이트 시 API 요청 본문에 사용할 타입
export interface UserUpdate {
  nickname?: string;
  introduction?: string;
  profile_image_url?: string; // API 명세에 맞춰 필드명 사용
  phone?: string; // API 명세에는 없지만 profile 페이지에서 사용하므로 추가 (선택 사항)
}
