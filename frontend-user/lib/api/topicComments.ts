import { Comment } from "@/lib/types/comment";
import { fetchWrapper as fw } from "./fetchWrapper";

// Represents the raw comment structure from the API
interface ApiComment {
  id: number;
  parent_comment_id: number | null;
  content: string;
  created_at: string;
  user_id: number;
  nickname: string;
  profile_image_url: string;
  user_vote_side: "LEFT" | "RIGHT" | "NEUTRAL";
  replies: ApiComment[];
  status: "ACTIVE" | "HIDDEN" | "DELETED_BY_USER" | "DELETED_BY_ADMIN";
  like_count?: number;
  dislike_count?: number;
  my_reaction?: "LIKE" | "DISLIKE" | null;
}

// Recursively maps an API comment to the frontend Comment type
const mapApiCommentToComment = (apiComment: ApiComment): Comment => {
  return {
    id: apiComment.id,
    parent_id: apiComment.parent_comment_id,
    content: apiComment.content,
    created_at: apiComment.created_at,
    author_id: apiComment.user_id,
    author_name: apiComment.nickname,
    profile_image_url: apiComment.profile_image_url,
    stance: apiComment.user_vote_side,
    children: (apiComment.replies || []).map(mapApiCommentToComment), // Recursive call
    status: apiComment.status,
    like_count: apiComment.like_count || 0,
    dislike_count: apiComment.dislike_count || 0,
    my_reaction: apiComment.my_reaction || null,
  };
};

/**
 * Fetches comments for a specific topic.
 * The API returns a nested structure, which we expect to be handled by the component.
 */
export async function getTopicComments(topicId: string, token?: string): Promise<{ comments: Comment[] }> {
  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
  const response = await fw(`/api/comments/topics/${topicId}`, {
    headers,
    cache: "no-store",
  });
  if (!response.ok) {
    console.error("Failed to fetch topic comments, status:", response.status);
    throw new Error("토론의 댓글을 불러오는 데 실패했습니다.");
  }

  const rawData = await response.json();
  const rawComments: ApiComment[] = Array.isArray(rawData) ? rawData : rawData.comments || [];

  const mappedComments: Comment[] = rawComments.map(mapApiCommentToComment);

  return { comments: mappedComments };
}

/**
 * Posts a new comment to a specific topic.
 * The 'stance' is important to categorize the comment under 'pro', 'con', or 'neutral'.
 */
export async function postTopicComment(
  topicId: string,
  content: string,
  parentId: number | null,
  stance: "LEFT" | "RIGHT" | "NEUTRAL",
  token: string
): Promise<Comment> {
  const response = await fw(`/api/comments/topics/${topicId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ content, parentCommentId: parentId, userVoteSide: stance }),
  });
  if (!response.ok) {
    const err: { message: string } = await response.json().catch(() => ({ message: "댓글 작성에 실패했습니다." }));
    throw new Error(err.message);
  }
  return response.json();
}

/**
 * Updates (patches) an existing comment.
 */
export async function updateTopicComment(commentId: number, content: string, token: string): Promise<Comment> {
  const response = await fw(`/api/comments/${commentId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!response.ok) {
    const err: { message: string } = await response.json().catch(() => ({ message: "댓글 수정에 실패했습니다." }));
    throw new Error(err.message);
  }
  return response.json();
}

/**
 * Deletes a comment.
 */
export async function deleteTopicComment(commentId: number, token: string): Promise<void> {
  const response = await fw(`/api/comments/${commentId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok && response.status !== 204) {
    const err: { message: string } = await response.json().catch(() => ({ message: "댓글 삭제에 실패했습니다." }));
    throw new Error(err.message);
  }
}

export async function toggleTopicCommentReaction(
  commentId: number,
  reactionType: "LIKE" | "DISLIKE",
  token: string
): Promise<void> {
  const response = await fw(`/api/comments/${commentId}/reactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ reactionType }),
  });
  if (!response.ok) {
    const err: { message: string } = await response.json().catch(() => ({ message: "반응 처리에 실패했습니다." }));
    throw new Error(err.message);
  }
}

/**
 * Reports a comment.
 */
export async function reportTopicComment(commentId: number, reason: string, token: string): Promise<void> {
  const response = await fw(`/api/comments/${commentId}/reports`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ reason }),
  });
  if (!response.ok) {
    const err: { message: string } = await response.json().catch(() => ({ message: "신고 처리에 실패했습니다." }));
    throw new Error(err.message);
  }
}

/**
 * Posts a reaction to a specific comment.
 * @param commentId - The ID of the comment to react to.
 * @param reactionType - The type of reaction (e.g., 'like', 'dislike').
 * @param token - User authentication token.
 * @returns A promise that resolves to an object indicating success or a message.
 */
export async function postCommentReaction(
  commentId: number,
  reactionType: string,
  token: string
): Promise<{ message: string }> {
  const response = await fw(`/api/comments/${commentId}/reactions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ reaction_type: reactionType }), // Assuming the backend expects 'reaction_type'
  });
  if (!response.ok) {
    const err: { message: string } = await response.json().catch(() => ({ message: "댓글 반응 추가에 실패했습니다." }));
    throw new Error(err.message);
  }
  return response.json();
}
