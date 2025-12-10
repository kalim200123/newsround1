/**
 * @file fetchWrapper.ts
 * @description 백엔드 API 통신을 위한 중앙 집중식 fetch 유틸리티 함수를 정의합니다.
 * 이 파일은 모든 HTTP 요청을 감싸서 공통 헤더 추가, URL 조합, 인증 에러(401) 처리 등
 * 반복적인 작업을 표준화하고 자동화하는 역할을 합니다.
 */

import { BACKEND_BASE_URL } from "@/lib/constants";

/**
 * @constant {string} SESSION_EXPIRED_EVENT
 * @description 세션 만료 시 발생하는 커스텀 이벤트의 이름입니다.
 * 401 Unauthorized 응답을 받으면 이 이벤트가 window 객체에서 발생하며,
 * AuthContext에서 이 이벤트를 수신하여 로그아웃 처리를 수행합니다.
 * 이를 통해 API 호출이 일어나는 모든 위치에서 개별적으로 401 에러를 처리할 필요가 없어집니다.
 */
const SESSION_EXPIRED_EVENT = 'sessionExpired';

/**
 * @function fetchWrapper
 * @description 백엔드 API 서버에 HTTP 요청을 보내기 위한 통합 fetch 래퍼 함수입니다.
 * @param {string} url - 요청할 API의 엔드포인트 경로 (예: '/api/articles').
 * @param {RequestInit & { skipAuthCheckFor401?: boolean }} [options={}] - fetch 함수에 전달될 옵션 객체.
 *   - `skipAuthCheckFor401`: true일 경우, 401 에러가 발생해도 세션 만료 이벤트를 발생시키지 않고,
 *     호출한 쪽에서 직접 에러를 처리하도록 응답을 그대로 반환합니다. (주로 로그인 페이지에서 사용)
 * @returns {Promise<Response>} - fetch API의 Response 객체를 반환하는 프로미스.
 * @throws {Error} - 네트워크 오류가 발생하거나 401 에러(세션 만료)가 발생했을 때 에러를 throw합니다.
 * 
 * @example
 * // GET 요청
 * const response = await fetchWrapper('/api/users/1');
 * 
 * // POST 요청
 * const response = await fetchWrapper('/api/users', {
 *   method: 'POST',
 *   body: JSON.stringify({ name: 'John Doe' }),
 * });
 * 
 * // 로그인 요청 (401 에러를 직접 처리)
 * const response = await fetchWrapper('/api/auth/login', {
 *   method: 'POST',
 *   body: JSON.stringify({ email, password }),
 *   skipAuthCheckFor401: true,
 * });
 */
export async function fetchWrapper(url: string, options: RequestInit & { skipAuthCheckFor401?: boolean } = {}): Promise<Response> {
  const method = options.method?.toUpperCase() || 'GET';

  // 1. 헤더 설정
  const headers = new Headers(options.headers);
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  // POST, PUT, PATCH 요청이면서 FormData가 아닐 경우에만 Content-Type을 설정합니다.
  if (['POST', 'PUT', 'PATCH'].includes(method) && !(options.body instanceof FormData)) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
  }

  // 2. 요청 URL 조합
  const fullUrl = url.startsWith('http') ? url : `${BACKEND_BASE_URL}${url}`;

  // 3. 캐시 옵션 설정
  const isGetRequest = method === 'GET';
  const cacheOption: RequestInit = (isGetRequest && !options.cache && !options.next) ? { cache: 'no-store' } : {};

  // 4. fetch 요청 실행
  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers: headers, // 수정된 헤더 사용
      ...cacheOption,
    });

    // 5. 401 Unauthorized 에러 처리
    if (response.status === 401) {
      if (options.skipAuthCheckFor401) {
        return response;
      }
      console.log("Fetch wrapper: 401 Unauthorized. Dispatching sessionExpired event.");
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
      throw new Error('Session expired');
    }

    // 6. 성공적인 응답 반환
    return response;
  } catch (error) {
    console.error("FetchWrapper Error:", error);
    console.error("Failed to fetch:", { fullUrl, options });
    throw error;
  }
}

/**
 * @function addSessionExpiredListener
 * @description 'sessionExpired' 커스텀 이벤트에 대한 리스너를 등록하는 헬퍼 함수입니다.
 * AuthContext에서 이 함수를 사용하여 세션 만료 시 수행할 콜백(예: 로그아웃)을 등록합니다.
 * @param {() => void} callback - 세션 만료 이벤트가 발생했을 때 실행될 콜백 함수.
 * @returns {() => void} - 등록된 이벤트 리스너를 제거하는 클린업(cleanup) 함수.
 *                         React의 useEffect 훅에서 반환값으로 사용하여 컴포넌트 언마운트 시 자동으로 리스너를 제거할 수 있습니다.
 * 
 * @example
 * // AuthContext.tsx 내에서 사용
 * useEffect(() => {
 *   const cleanup = addSessionExpiredListener(() => {
 *     // 로그아웃 처리 로직
 *     logout();
 *   });
 * 
 *   return cleanup; // 컴포넌트가 사라질 때 리스너 자동 제거
 * }, []);
 */
export function addSessionExpiredListener(callback: () => void) {
  // 이벤트 발생 시 실행될 핸들러 함수
  const handleSessionExpired = () => {
    console.log("Event listener: sessionExpired event received.");
    callback();
  };

  // window 객체에 이벤트 리스너 추가
  window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
  
  // 클린업 함수를 반환하여 리스너를 제거할 수 있도록 함
  return () => {
    window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
  };
}
