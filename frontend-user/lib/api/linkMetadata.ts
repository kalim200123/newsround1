import { fetchWrapper } from "./fetchWrapper";
import { LinkMetadata } from "@/lib/types/shared";

export async function getLinkMetadata(url: string): Promise<LinkMetadata> {
  const response = await fetchWrapper(`/metadata?url=${encodeURIComponent(url)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch link metadata: ${response.statusText}`);
  }
  return response.json();
}
