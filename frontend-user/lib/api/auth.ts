/**
 * @file auth.ts
 * @description 사용자 인증(회원가입, 로그인)과 관련된 백엔드 API 호출 함수를 정의합니다.
 * 이 파일의 함수들은 `fetchWrapper`를 사용하여 서버와 통신하며,
 * 인증 과정에서 발생하는 특정 HTTP 상태 코드(예: 401)를 비즈니스 로직에 맞게 처리합니다.
 */

import { SignUpData, AuthResponse, LoginCredentials } from "@/lib/types/auth";
import { fetchWrapper } from "./fetchWrapper";

/**
 * @function signUpUser
 * @description 사용자가 입력한 정보로 회원가입을 요청합니다.
 * @param {any} userData - 회원가입 폼에서 받은 사용자 정보 객체.
 *                         (예: { email, password, name, nickname })
 * @returns {Promise<any>} - 회원가입 성공 시, 백엔드로부터 받은 응답 데이터를 반환하는 프로미스.
 * @throws {Error} - API 호출이 실패하거나 응답이 'ok'가 아닐 경우,
 *                   백엔드에서 받은 에러 메시지나 기본 에러 메시지를 포함한 에러를 발생시킵니다.
 */
export async function signUpUser(userData: SignUpData): Promise<AuthResponse> {


  const response = await fetchWrapper(`/api/auth/signup`, {
    method: 'POST',
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    // 응답이 성공적이지 않으면, 백엔드가 보낸 에러 메시지를 사용하거나 기본 메시지를 설정하여 에러를 throw합니다.
    const data = await response.json().catch(() => ({ message: '회원가입에 실패했습니다.' }));
    throw new Error(data.message || '회원가입에 실패했습니다.');
  }

  // 응답 본문을 먼저 파싱하여 에러 메시지 등을 확인합니다.
  const data = await response.json();
  return data; // 성공 시 파싱된 데이터를 반환합니다.
}

/**
 * @function loginUser
 * @description 사용자가 입력한 이메일과 비밀번호로 로그인을 요청합니다.
 * @param {any} credentials - 로그인에 필요한 자격 증명 객체. (예: { email, password })
 * @returns {Promise<any>} - 로그인 성공 시, 사용자 정보와 토큰을 포함한 데이터를 반환하는 프로미스.
 * @throws {Error} - 로그인 실패 시, 실패 원인에 대한 메시지를 포함한 에러를 발생시킵니다.
 * @special
 * - `skipAuthCheckFor401: true`: `fetchWrapper`에 이 옵션을 전달하여,
 *   401 Unauthorized 에러가 발생해도 `fetchWrapper`의 전역 세션 만료 처리를 건너뛰도록 합니다.
 *   로그인 과정에서 401 에러는 '세션 만료'가 아닌 '자격 증명 불일치'를 의미하기 때문입니다.
 *   따라서 이 함수 내에서 401 에러를 직접 처리하여 사용자에게 "이메일 또는 비밀번호가 일치하지 않습니다."와 같은
 *   명확한 피드백을 제공합니다.
 */
export async function loginUser(credentials: LoginCredentials): Promise<AuthResponse> {

  
  const response = await fetchWrapper(`/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify(credentials),
    skipAuthCheckFor401: true, // 401 에러를 이 함수에서 직접 처리하기 위해 wrapper의 전역 처리를 건너뜀
  });

  if (!response.ok) {
    let errorData: { message?: string } = {};
    try {
      // 백엔드에서 에러 메시지를 JSON 형식으로 보내지 않을 수도 있으므로,
      // JSON 파싱 과정 자체에서 에러가 발생하지 않도록 try-catch로 감쌉니다.
      errorData = await response.json();
    } catch (e) {
      console.error("Error parsing login error response:", e);
    }

    if (response.status === 401) {
      // 로그인 실패 시 401 상태 코드는 '이메일 또는 비밀번호 불일치'로 해석합니다.
      throw new Error('이메일 또는 비밀번호가 일치하지 않습니다.');
    }
    // 401 이외의 다른 에러(예: 500 서버 에러)의 경우,
    // 백엔드에서 받은 메시지를 사용하거나 일반적인 실패 메시지를 사용합니다.
    throw new Error(errorData.message || '로그인에 실패했습니다.');
  }

  // 응답이 성공적인(ok) 경우에만 응답 본문을 파싱하여 반환합니다.
  const data = await response.json();
  return data;
}
