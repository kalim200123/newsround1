import { SavedArticleCategory } from "@/lib/types/shared";
import { fetchWrapper } from "./fetchWrapper";

export async function getCategories(token: string): Promise<SavedArticleCategory[]> {
  const response = await fetchWrapper(`/api/saved/categories`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error("카테고리를 불러오는 데 실패했습니다.");
  }
  return response.json();
}

export async function createCategory(token: string, name: string): Promise<SavedArticleCategory> {
  const response = await fetchWrapper(`/api/saved/categories`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    throw new Error("카테고리 생성에 실패했습니다.");
  }
  return response.json();
}

export async function deleteCategory(token: string, categoryId: number): Promise<void> {
  const response = await fetchWrapper(`/api/saved/categories/${categoryId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error("카테고리 삭제에 실패했습니다.");
  }
}

export async function updateCategory(
  token: string,
  categoryId: number,
  newName: string
): Promise<SavedArticleCategory> {
  const response = await fetchWrapper(`/api/saved/categories/${categoryId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: newName }),
  });
  if (!response.ok) {
    throw new Error("카테고리 이름 변경에 실패했습니다.");
  }
  return response.json();
}

export async function updateArticleCategory(
  token: string,
  saved_article_id: number,
  newCategoryId: number | null
): Promise<void> {
  const response = await fetchWrapper(`/api/saved/articles/${saved_article_id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ categoryId: newCategoryId }),
  });
  if (!response.ok) {
    throw new Error("기사 카테고리 업데이트에 실패했습니다.");
  }
}
