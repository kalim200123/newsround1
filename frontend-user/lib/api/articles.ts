/**
 * @file articles.ts
 * @description 기사(Article)와 관련된 모든 백엔드 API 호출을 정의하는 파일입니다.
 * 각 함수는 특정 종류의 기사 데이터를 가져오거나, 기사와 관련된 상호작용(좋아요, 저장)을 처리합니다.
 * 모든 함수는 중앙 집중식 에러 처리 및 요청 관리를 위해 `fetchWrapper`를 사용합니다.
 */

import { Article } from "@/lib/types/article";
import { SearchResult } from "@/lib/types/search";
import { ToggleSaveResponse } from "@/lib/types/shared";
import { fetchWrapper } from "./fetchWrapper";

/**
 * @function getBreakingNews
 * @description 백엔드에서 '속보'로 분류된 기사 목록을 가져옵니다.
 * @returns {Promise<Article[]>} - 속보 기사 객체의 배열을 반환하는 프로미스. API 실패 시 빈 배열을 반환합니다.
 * @cache Next.js의 Incremental Static Regeneration (ISR)을 사용하여 5분(300초)마다 캐시를 갱신합니다.
 *        이를 통해 빌드 시점에 정적으로 페이지를 생성하고, 주기적으로 최신 데이터로 업데이트할 수 있습니다.
 */
export async function getBreakingNews(token?: string): Promise<Article[]> {
  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const fetchOptions: RequestInit = {
    headers,
  };

  if (token) {
    fetchOptions.cache = "no-store";
  } else {
    fetchOptions.next = { revalidate: 300 }; // 5분마다 캐시 갱신
  }

  try {
    const res = await fetchWrapper(`/articles/breaking?limit=5&offset=0`, fetchOptions);
    console.log("getBreakingNews - API Response Status:", res.status, "OK:", res.ok);
    if (!res.ok) {
      console.error("getBreakingNews - API Response not OK:", res.status, res.statusText);
      return []; // API 응답이 실패하면 빈 배열 반환
    }
    const articles = await res.json();
    console.log("getBreakingNews - Parsed Articles:", articles);
    const sortedArticles = articles
      .map((article: Article) => ({ ...article, articleType: "home" }))
      .sort((a: Article, b: Article) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());

    return sortedArticles;
  } catch (error) {
    if ((error as Error).message === "Session expired") return [];
    console.error("getBreakingNews - Failed to fetch breaking news:", error);
    return [];
  }
}

/**
 * @function getExclusiveNews
 * @description 백엔드에서 '단독'으로 분류된 기사 목록을 가져옵니다.
 * @returns {Promise<Article[]>} - 단독 기사 객체의 배열을 반환하는 프로미스. API 실패 시 빈 배열을 반환합니다.
 * @cache 5분(300초) 주기로 ISR을 통해 캐시를 갱신합니다.
 */
export async function getExclusiveNews(): Promise<Article[]> {
  try {
    const res = await fetchWrapper(`/articles/exclusives?limit=5&offset=0`, {
      next: { revalidate: 300 }, // 5분마다 캐시 갱신
    });
    console.log("getExclusiveNews - API Response Status:", res.status, "OK:", res.ok);
    if (!res.ok) {
      console.error("getExclusiveNews - API Response not OK:", res.status, res.statusText);
      return [];
    }
    const articles = await res.json();
    console.log("getExclusiveNews - Parsed Articles:", articles);
    const sortedArticles = articles
      .map((article: Article) => ({ ...article, articleType: "home" }))
      .sort((a: Article, b: Article) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
    return sortedArticles;
  } catch (error) {
    if ((error as Error).message === "Session expired") return [];
    console.error("getExclusiveNews - Failed to fetch exclusive news:", error);
    return [];
  }
}

/**
 * @function getCategoryNews
 * @description 특정 카테고리에 해당하는 뉴스 기사 목록을 가져옵니다.
 *              개발 환경에서는 목업 데이터를 사용하고, 프로덕션 환경에서는 실제 API를 호출합니다.
 * @param {string} categoryName - 가져올 뉴스의 카테고리 이름 (예: "정치", "경제").
 * @param {number} [limit=10] - 가져올 기사의 최대 개수.
 * @param {string} [token] - 사용자 인증 토큰. 제공될 경우, 개인화된 데이터를 포함할 수 있습니다.
 * @returns {Promise<Article[]>} - 해당 카테고리의 기사 객체 배열을 반환하는 프로미스.
 */
export async function getCategoryNews(categoryName: string, limit?: number, token?: string): Promise<Article[]> {
  // 프로덕션 환경에서는 실제 API를 호출합니다.
  const encodedCategoryName = encodeURIComponent(categoryName);
  let apiUrl = `/articles/by-category?name=${encodedCategoryName}`;

  if (limit) {
    apiUrl += `&limit=${limit}`;
  }

  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetchWrapper(apiUrl, {
      cache: "no-store", // 데이터가 2MB를 초과하여 캐시 오류가 발생하므로 캐시를 사용하지 않음
      headers: headers,
    });
    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`Category "${categoryName}" not found or has no articles.`);
        return [];
      } else {
        throw new Error(`API 호출 실패 (${categoryName}): ${response.status}`);
      }
    }
    const articles = await response.json();
    return articles.map((article: Article) => ({ ...article, articleType: "home" }));
  } catch (error) {
    if ((error as Error).message === "Session expired") return [];
    console.error(`${categoryName} 뉴스 로드 실패:`, error);
    return [];
  }
}

/**
 * @function getLatestNews
 * @description 여러 주요 카테고리의 최신 뉴스를 모두 가져와 시간순으로 정렬하여 반환합니다.
 * @param {number} [limit=10] - 최종적으로 반환할 기사의 최대 개수.
 * @param {string} [token] - 사용자 인증 토큰.
 * @returns {Promise<Article[]>} - 모든 카테고리를 종합한 최신 기사 객체 배열.
 * @logic
 * 1. 정의된 모든 카테고리("정치", "경제", "사회", "문화")에 대해 `getCategoryNews`를 병렬로 호출합니다.
 * 2. 모든 결과를 하나의 배열로 합칩니다.
 * 3. `Map`을 사용하여 기사 ID를 기준으로 중복된 기사를 제거합니다.
 * 4. 중복이 제거된 기사들을 발행 시간(`published_at`) 기준으로 내림차순(최신순) 정렬합니다.
 * 5. 정렬된 배열에서 `limit` 개수만큼 잘라서 반환합니다.
 */
export async function getLatestNews(limit: number = 10, token?: string): Promise<Article[]> {
  // This function now uses the mocked getCategoryNews, so it will work automatically.
  try {
    const categories = ["정치", "경제", "사회", "문화"];
    const promises = categories.map((category) => getCategoryNews(category, limit, token));
    const results = await Promise.all(promises);

    const allArticles = results.flat(); // 2차원 배열을 1차원 배열로 평탄화

    // Map을 이용해 중복 기사 제거 (ID 기준)
    const uniqueArticlesMap = new Map<number, Article>();
    allArticles.forEach((article) => {
      uniqueArticlesMap.set(article.id, article);
    });

    const uniqueArticles = Array.from(uniqueArticlesMap.values());
    // 최신순으로 정렬
    uniqueArticles.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());

    return uniqueArticles.slice(0, limit); // 지정된 개수만큼 잘라서 반환
  } catch (error) {
    if ((error as Error).message === "Session expired") return [];
    console.error("최신 뉴스 종합 실패:", error);
    return [];
  }
}

/**
 * @function getAllLatestNews
 * @description '최신 뉴스 전체보기' 페이지를 위해, 각 카테고리별로 50개씩 기사를 가져와 종합하고 최신순으로 정렬합니다.
 * @returns {Promise<Article[]>} - 모든 카테고리를 종합한 최신 기사 50개*4=200개 내외의 배열.
 * @logic `getLatestNews`와 유사하지만, 더 많은 기사(카테고리당 50개)를 가져와 페이지네이션 없이 보여주기 위한 목적입니다.
 */
export async function getAllLatestNews(): Promise<Article[]> {
  // This function now uses the mocked getCategoryNews, so it will work automatically.
  const categories = ["정치", "경제", "사회", "문화"];
  const newsPromises = categories.map((category) =>
    getCategoryNews(category, 50).catch((err) => {
      console.error(`Error fetching latest news for category ${category}:`, err);
      return []; // 특정 카테고리 로드 실패 시에도 전체가 실패하지 않도록 빈 배열 반환
    })
  );

  const results = await Promise.all(newsPromises);
  const allArticles = results.flat();

  const uniqueArticlesMap = new Map<number, Article>();
  allArticles.forEach((article) => {
    uniqueArticlesMap.set(article.id, article);
  });

  const sortedArticles = Array.from(uniqueArticlesMap.values()).sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );

  return sortedArticles;
}

/**
 * @function getSearchArticles
 * @description 검색어(query)를 받아 기사 제목과 설명에서 일치하는 기사를 검색하여 최신순으로 반환합니다.
 * @param {string} q - 사용자가 입력한 검색어.
 * @param {string} [token] - 사용자 인증 토큰.
 * @returns {Promise<SearchResult>} - 검색 결과에 해당하는 기사 및 관련 토픽 객체.
 * @throws {Error} - API 호출 실패 시 에러를 발생시킵니다.
 * @cache 1분(60초) 주기로 ISR을 통해 캐시를 갱신합니다.
 */
export async function getSearchArticles(q: string, token?: string): Promise<SearchResult> {
  const encodedQuery = encodeURIComponent(q);
  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const response = await fetchWrapper(`/articles/search?q=${encodedQuery}`, {
    method: "GET",
    headers: headers,
    next: { revalidate: 60 }, // 1분마다 캐시 갱신
  });

  if (!response.ok) {
    throw new Error("검색 결과를 가져오는데 실패했습니다.");
  }

  const data = await response.json();

  return {
    articles: (data.articles || []).map((article: Article) => ({ ...article, articleType: "home" })),
    relatedTopics: data.relatedTopics || [],
  };
}

/**
 * @function getPopularNews
 * @description '좋아요'가 많은 인기 기사 목록을 가져옵니다.
 * @param {string} [category] - 특정 카테고리의 인기 기사를 가져올 경우 카테고리 이름. 제공되지 않으면 전체 카테고리를 대상으로 합니다.
 * @param {string} [token] - 사용자 인증 토큰.
 * @returns {Promise<Article[]>} - 인기 기사 객체 배열.
 * @logic
 * - `category`가 지정되면 해당 카테고리의 인기 기사만 가져옵니다.
 * - `category`가 없으면 모든 주요 카테고리의 인기 기사를 각각 가져와 합친 후,
 *   중복을 제거하고 '좋아요' 수(`like_count`) 기준으로 내림차순 정렬하여 상위 20개를 반환합니다.
 */
export async function getPopularNews(category?: string, token?: string): Promise<Article[]> {
  // 단일 카테고리에 대한 인기 기사를 가져오는 내부 함수
  const fetchByCategory = async (cat: string): Promise<Article[]> => {
    const url = `/articles/popular?category=${encodeURIComponent(cat)}`;
    const headers: HeadersInit = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    try {
      const response = await fetchWrapper(url, {
        cache: "no-store",
        headers: headers,
      });
      if (!response.ok) {
        console.error(`API 호출 실패 (인기 기사 - ${cat}): ${response.status}`);
        return [];
      }
      const articles = await response.json();
      return articles.map((article: Article) => ({ ...article, articleType: "home" }));
    } catch (error) {
      if ((error as Error).message === "Session expired") return [];
      console.error(`인기 기사 로드 실패 (${cat}):`, error);
      return [];
    }
  };

  // 특정 카테고리가 지정된 경우
  if (category) {
    return fetchByCategory(category);
  }

  // 전체 카테고리에 대한 인기 기사를 종합하는 경우
  try {
    const categories = ["정치", "경제", "사회", "문화"];
    const promises = categories.map(fetchByCategory);
    const results = await Promise.all(promises);

    const allArticles = results.flat();

    const uniqueArticlesMap = new Map<number, Article>();
    allArticles.forEach((article) => {
      uniqueArticlesMap.set(article.id, article);
    });

    const uniqueArticles = Array.from(uniqueArticlesMap.values());

    // '조회수'가 많은 순서대로 정렬
    uniqueArticles.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));

    return uniqueArticles.slice(0, 20); // 상위 20개 반환
  } catch (error) {
    if ((error as Error).message === "Session expired") return [];
    console.error("전체 인기 뉴스 종합 실패:", error);
    return [];
  }
}

/**
 * @function toggleArticleSave
 * @description 사용자가 특정 기사를 저장하거나 저장을 취소합니다.
 * @param {string} token - 사용자 인증 토큰 (필수).
 * @param {number} articleId - 저장할 기사의 ID.
 * @param {boolean} currentIsSaved - 현재 저장 상태. true이면 저장 취소(DELETE), false이면 저장(POST)합니다.
 * @param {string} articleType - 기사 유형 ('home' | 'topic').
 * @returns {Promise<any>} - 성공 시 API의 응답을 그대로 반환합니다. 204 No Content의 경우 성공 객체를 반환합니다.
 * @throws {Error} - API 호출 실패 시 에러를 발생시킵니다.
 */
export async function toggleArticleSave(
  token: string,
  articleId: number,
  currentIsSaved: boolean,
  articleType: "home" | "topic"
): Promise<ToggleSaveResponse> {
  const method = currentIsSaved ? "DELETE" : "POST";
  // DELETE 요청 시에는 query param으로, POST 요청 시에는 body로 articleType을 전달해야 함
  let url = `/articles/${articleId}/save`;
  const options: RequestInit = {
    method: method,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  if (method === "DELETE") {
    url += `?articleType=${articleType}`;
  } else {
    options.body = JSON.stringify({ articleType });
    // body를 보낼 때는 Content-Type 헤더가 필요할 수 있음 (fetchWrapper가 처리하는지 확인 필요하지만 명시적으로 추가)
    options.headers = {
      ...options.headers,
      "Content-Type": "application/json",
    };
  }

  const response = await fetchWrapper(url, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    // 409 Conflict is expected when saving an already saved article, treat as success or handle in UI
    if (response.status === 409 && !currentIsSaved) {
      throw new Error("이미 저장된 기사입니다.");
    }
    throw new Error(errorData.message || "기사 저장/취소에 실패했습니다.");
  }

  return response.json();
}
