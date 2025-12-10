import { fetchWrapper } from "./fetchWrapper";
import { TrendingKeyword } from "@/lib/types/topic";

export async function getTrendingKeywords(): Promise<TrendingKeyword[]> {
  try {
    const response = await fetchWrapper(`/keywords/trending`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      console.error("Failed to fetch trending keywords, status:", response.status);
      return [];
    }

    return response.json();
  } catch (error) {
    console.error("An error occurred while fetching trending keywords:", error);
    return [];
  }
}
