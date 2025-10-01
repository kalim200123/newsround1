
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUserAuth } from '../context/UserAuthContext';

interface Comment {
  id: number;
  content: string;
  created_at: string;
  username: string;
}

interface CommentsProps {
  topicId: string;
}

const Comments: React.FC<CommentsProps> = ({ topicId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const { user } = useUserAuth();

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/topics/${topicId}/comments`);
        setComments(response.data);
      } catch (error) {
        console.error('Error fetching comments:', error);
      }
    };

    fetchComments();
  }, [topicId]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const token = localStorage.getItem('user_token');
      const response = await axios.post(
        `http://localhost:3000/api/topics/${topicId}/comments`,
        { content: newComment },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setComments([response.data, ...comments]);
      setNewComment('');
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment. Please make sure you are logged in.');
    }
  };

  return (
    <div className="comments-section">
      <h2>Comments</h2>
      {user ? (
        <form onSubmit={handleSubmitComment} className="comment-form">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            rows={3}
          />
          <button type="submit">Post Comment</button>
        </form>
      ) : (
        <p>Please <a href="/login">login</a> to post a comment.</p>
      )}

      <div className="comment-list">
        {comments.map((comment) => (
          <div key={comment.id} className="comment-item">
            <p className="comment-content">{comment.content}</p>
            <small className="comment-meta">
              by {comment.username} on {new Date(comment.created_at).toLocaleDateString()}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Comments;
