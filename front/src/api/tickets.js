import api from './axios';

// Get service types for the dropdown
export const getServiceTypes = async () => {
  const response = await api.get('/tickets/types-service/');
  return response.data;
};

// Get client's own tickets
export const getMyTickets = async () => {
  const response = await api.get('/tickets/mes-tickets/');
  return response.data;
};

// Get a single ticket detail
export const getTicketDetail = async (id) => {
  const response = await api.get(`/tickets/mes-tickets/${id}/`);
  return response.data;
};

// Create a new ticket
export const createTicket = async (ticketData) => {
  const response = await api.post('/tickets/mes-tickets/', ticketData);
  return response.data;
};

// Upload attachment to a ticket
export const uploadAttachment = async (ticketId, file) => {
  const formData = new FormData();
  formData.append('fichier', file);
  const response = await api.post(`/tickets/${ticketId}/pieces-jointes/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// Submit satisfaction rating
export const submitSatisfaction = async (ticketId, satisfaction, commentaire) => {
  const response = await api.post(`/tickets/mes-tickets/${ticketId}/`, {
    satisfaction_client: satisfaction,
    commentaire_satisfaction: commentaire,
  });
  return response.data;
};

// Delete a ticket (only if still 'soumis')
export const deleteTicket = async (ticketId) => {
  const response = await api.delete(`/tickets/mes-tickets/${ticketId}/`);
  return response.data;
};

// ─── AGENT APIs ───

// Get agent's assigned tickets
export const getAgentTickets = async () => {
  const response = await api.get('/tickets/agent/mes-tickets/');
  return response.data;
};

// Get agent ticket detail
export const getAgentTicketDetail = async (id) => {
  const response = await api.get(`/tickets/agent/mes-tickets/${id}/`);
  return response.data;
};

// Get client's ticket history
export const getTicketClientHistory = async (id) => {
  const response = await api.get(`/tickets/agent/mes-tickets/${id}/historique/`);
  return response.data;
};

// Update ticket status / resolution
export const updateTicketStatus = async (id, data) => {
  const response = await api.put(`/tickets/agent/mes-tickets/${id}/`, data);
  return response.data;
};

// Escalate a ticket
export const escalateTicket = async (id, data) => {
  const response = await api.post(`/tickets/agent/mes-tickets/${id}/escalader/`, data);
  return response.data;
};

// ─── ESCALADE / TECH / ANNEXE APIs ───

// Get escalated tickets (for tech & annex agents)
export const getEscalatedTickets = async () => {
  const response = await api.get('/tickets/escalades/');
  return response.data;
};

// ─── ADMIN APIs ───

// Get all tickets (admin)
export const getAllTickets = async (params = {}) => {
  const response = await api.get('/tickets/admin/tous/', { params });
  return response.data;
};

// Assign ticket to agent (admin)
export const assignTicketToAgent = async (ticketId, agentId) => {
  const response = await api.post(`/tickets/admin/${ticketId}/attribuer/`, { agent_id: agentId });
  return response.data;
};

// Toggle email relay for a ticket
export const toggleEmailRelay = async (ticketId) => {
  const response = await api.post(`/tickets/${ticketId}/toggle-email/`);
  return response.data;
};

// Request Hugging Face AI Support
export const chatWithSupport = async (data) => {
  const response = await api.post('/tickets/chat-support/', data);
  return response.data;
};
