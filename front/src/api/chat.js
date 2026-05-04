import api from './axios';

// Get messages for a ticket
export const getMessages = async (ticketId) => {
  const response = await api.get(`/chat/${ticketId}/messages/`);
  return response.data;
};

// Send a text message on a ticket
export const sendMessage = async (ticketId, contenu) => {
  const response = await api.post(`/chat/${ticketId}/messages/`, { contenu });
  return response.data;
};

// Send a message with an optional file attachment
export const sendMessageWithAttachment = async (ticketId, contenu, file) => {
  const formData = new FormData();
  if (contenu) formData.append('contenu', contenu);
  if (file) formData.append('fichier', file);
  const response = await api.post(`/chat/${ticketId}/messages/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getAISummary = async (ticketId) => {
  const response = await api.get(`/chat/${ticketId}/resume-ia/`);
  return response.data;
};

// Get unread message count
export const getUnreadCount = async () => {
  const response = await api.get('/chat/non-lus/');
  return response.data;
};
