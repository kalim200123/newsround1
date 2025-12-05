import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface ChatMessage {
  id: number;
  content: string;
  created_at: string;
  nickname: string; // The API returns nickname, not username
}

interface CommentsProps {
  topicId: string;
}

const Comments: React.FC<CommentsProps> = ({ topicId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!topicId) return;
      try {
        // Fetch from the correct, relative path
        const response = await axios.get(`/api/topics/${topicId}/chat`);
        setMessages(response.data);
      } catch (error) {
        console.error('Error fetching chat history:', error);
      }
    };

    fetchMessages();
  }, [topicId]);

  return (
    <div className="comments-section">
      <h2>실시간 채팅</h2>
      {/* The form for submitting new messages will be handled by a separate component using WebSockets */}
      <div className="comment-list">
        {messages.map((msg) => (
          <div key={msg.id} className="comment-item">
            <p className="comment-content">{msg.content}</p>
            <small className="comment-meta">
              by {msg.nickname} on {new Date(msg.created_at).toLocaleDateString()}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Comments;