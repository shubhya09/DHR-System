import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Send, User as UserIcon } from 'lucide-react';

const ChatComponent = ({ appointment, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const socketRef = useRef();
  const messagesEndRef = useRef(null);
  const token = localStorage.getItem('token');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    socketRef.current = io();
    socketRef.current.emit('join_chat', appointment._id);
    socketRef.current.on('receive_message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    const fetchMessages = async () => {
      try {
        const res = await axios.get(`/api/chat/${appointment._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessages(res.data);
      } catch (err) {
        console.error('Error fetching messages:', err);
      } finally {
        setLoading(false);
      }
    };

    const markAsRead = async () => {
      try {
        await axios.patch(`/api/chat/${appointment._id}/read`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error('Error marking messages as read:', err);
      }
    };

    fetchMessages();
    markAsRead();

    return () => {
      socketRef.current.disconnect();
    };
  }, [appointment._id, token]);

  useEffect(() => {
    scrollToBottom();
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.senderId !== currentUser.id && !lastMessage.read) {
        axios.patch(`/api/chat/${appointment._id}/read`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    }
  }, [messages, appointment._id, token, currentUser.id]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const res = await axios.post(`/api/chat/${appointment._id}`, { text: newMessage }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      socketRef.current.emit('send_message', res.data);
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  if (loading) return <div className="text-center p-4">Loading chat...</div>;

  return (
    <div className="chat-container" style={{ display: 'flex', flexDirection: 'column', height: '400px' }}>
      <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {messages.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--gray)', marginTop: '2rem' }}>No messages yet. Start the conversation!</p>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.senderId === currentUser.id;
            return (
              <div 
                key={index} 
                style={{ 
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  padding: '0.8rem 1rem',
                  borderRadius: '12px',
                  background: isMe ? 'var(--primary)' : '#f1f5f9',
                  color: isMe ? 'white' : 'inherit',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
              >
                <p style={{ margin: 0, fontSize: '0.9rem' }}>{msg.text}</p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                  <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {isMe && (
                    <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                      {msg.read ? '• Read' : '• Sent'}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} style={{ padding: '1rem', borderTop: '1px solid #eee', display: 'flex', gap: '0.5rem' }}>
        <input 
          type="text" 
          className="form-control" 
          placeholder="Type a message..." 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default ChatComponent;
