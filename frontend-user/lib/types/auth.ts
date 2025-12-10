import { User } from './user';

/**
 * @interface LoginCredentials
 * @description 로그인 요청 시 사용되는 사용자 자격 증명 데이터 구조.
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * @interface SignUpData
 * @description 회원가입 요청 시 사용되는 사용자 등록 데이터 구조.
 */
export interface SignUpData {
  email: string;
  password: string;
  name: string;
  nickname: string;
  phone?: string;
}

/**
 * @interface AuthResponse
 * @description 로그인 및 회원가입 성공 시 백엔드로부터 받는 응답 데이터 구조.
 */
export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}
