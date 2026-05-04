import api from './axios';

// ─── Stats & Rapports ───────────────────────────────────────

export const getAdminStats = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const query = params ? `?${params}` : '';
  const response = await api.get(`/rapports/stats/${query}`);
  return response.data;
};

export const getAgentsPerformance = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const query = params ? `?${params}` : '';
  const response = await api.get(`/rapports/performances/${query}`);
  return response.data;
};

// ─── Gestion des Agents (agent, agent_technique, agent_annexe) ──

export const getAgentsList = async () => {
  const response = await api.get('/users/agents/');
  return response.data;
};

export const getSessionHistory = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const query = params ? `?${params}` : '';
  const response = await api.get(`/users/connexions/${query}`);
  return response.data;
};

export const createAgent = async (data) => {
  const response = await api.post('/users/agents/', data);
  return response.data;
};

export const updateAgent = async (id, data) => {
  const response = await api.put(`/users/agents/${id}/`, data);
  return response.data;
};

export const deleteAgent = async (id) => {
  const response = await api.delete(`/users/agents/${id}/`);
  return response.data;
};

// ─── Tous les Tickets du Centre ─────────────────────────────

export const getAllTickets = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const query = params ? `?${params}` : '';
  const response = await api.get(`/tickets/admin/tous/${query}`);
  return response.data;
};

// ─── Attribution manuelle ───────────────────────────────────

export const assignTicket = async (ticketId, agentId) => {
  const response = await api.post(`/tickets/admin/${ticketId}/attribuer/`, { agent_id: agentId });
  return response.data;
};

// ─── Paramètres du centre ───────────────────────────────────

export const updateCentreParams = async (data) => {
  const response = await api.put('/centres/parametres/', data);
  return response.data;
};

export const getCentreParams = async () => {
  const response = await api.get('/centres/parametres/');
  return response.data;
};

// ─── Exports ────────────────────────────────────────────────

export const exportPDF = async () => {
  const response = await api.get('/rapports/export/pdf/', { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `rapport_${new Date().toISOString().slice(0,10)}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const exportExcel = async () => {
  const response = await api.get('/rapports/export/excel/', { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `rapport_${new Date().toISOString().slice(0,10)}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
