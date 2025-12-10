import { fetchWrapper } from './fetchWrapper';
import { Comment, ApiComment } from '@/lib/types/comment';

// Helper function to map ApiComment to Comment
const mapApiCommentToComment = (apiComment: ApiComment): Comment => {
  const comment: Comment = {
    id: apiComment.id,
    author_id: apiComment.user_id,
    author_name: apiComment.nickname,
    profile_image_url: apiComment.profile_image_url || apiComment.avatar_url,
    content: apiComment.content,
    created_at: apiComment.created_at,
    status: apiComment.status as Comment['status'],
    parent_id: apiComment.parent_comment_id,
    stance: apiComment.stance,
    children: [],
  };

  if (apiComment.replies && apiComment.replies.length > 0) {
    comment.children = apiComment.replies.map((reply: ApiComment) => mapApiCommentToComment(reply));
  }
  return comment;
};

/**
 * 특정 기사의 댓글 목록을 가져옵니다.
 * @param articleId - 댓글을 가져올 기사의 ID
 * @param token - 사용자 인증 토큰 (선택 사항)
 * @returns 댓글 목록 Promise
 */
export const getComments = async (articleId: number, token?: string): Promise<{ comments: Comment[], totalCount: number }> => {


  const url = `/api/articles/${articleId}/comments`;
  
  const response = await fetchWrapper(url, {
    method: 'GET',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: `Failed to fetch comments for article ${articleId}` }));
    throw new Error(errorData.message || `Failed to fetch comments for article ${articleId}`);
  }

  const apiResponse = await response.json();
  const mappedComments = (apiResponse.comments || []).map(mapApiCommentToComment);

  return {
    comments: mappedComments,
    totalCount: apiResponse.totalCount || 0,
  };
};

/**
 * 특정 기사에 새 댓글을 작성합니다.
 * @param articleId - 댓글을 작성할 기사의 ID
 * @param content - 댓글 내용
 * @param token - 사용자 인증 토큰
 * @param parentId - 부모 댓글 ID (대댓글인 경우)
 * @returns 생성된 댓글 Promise
 */
export const addComment = async (articleId: number, content: string, token: string, parentId?: number): Promise<Comment> => {


  const response = await fetchWrapper(`/api/articles/${articleId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ content, parent_comment_id: parentId }), // Use parent_comment_id
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: `Failed to add comment to article ${articleId}` }));
    throw new Error(errorData.message || `Failed to add comment to article ${articleId}`);
  }
  
  const apiResponse: { message: string; comment: ApiComment } = await response.json();
  return mapApiCommentToComment(apiResponse.comment);
};

/**
 * 댓글을 삭제합니다.
 * @param commentId - 삭제할 댓글의 ID
 * @param token - 사용자 인증 토큰
 * @returns 성공 여부 Promise
 */
export const deleteComment = async (commentId: number, token: string): Promise<{ message: string }> => {


  const response = await fetchWrapper(`/api/comments/${commentId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: `Failed to delete comment ${commentId}` }));
    throw new Error(errorData.message || `Failed to delete comment ${commentId}`);
  }

  return response.json(); // This API returns { message: string }, no mapping needed
};

/**
 * 댓글을 수정합니다.
 * @param commentId - 수정할 댓글의 ID
 * @param content - 수정할 내용
 * @param token - 사용자 인증 토큰
 * @returns 수정된 댓글 Promise
 */
export const updateComment = async (commentId: number, content: string, token: string): Promise<Comment> => {


  const response = await fetchWrapper(`/api/comments/${commentId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: `Failed to update comment ${commentId}` }));
    throw new Error(errorData.message || `Failed to update comment ${commentId}`);
  }

  const apiComment: ApiComment = await response.json();
  return mapApiCommentToComment(apiComment);
};

/**
 * 특정 댓글을 신고합니다.
 * @param commentId - 신고할 댓글의 ID
 * @param reason - 신고 사유
 * @param token - 사용자 인증 토큰
 * @returns 응답 메시지 Promise
 */
export const reportComment = async (commentId: number, reason: string, token: string): Promise<{ message: string }> => {


  const response = await fetchWrapper(`/api/comments/${commentId}/report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ reason }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: `Failed to report comment ${commentId}` }));
    throw new Error(errorData.message || `Failed to report comment ${commentId}`);
  }
  return response.json();
};
