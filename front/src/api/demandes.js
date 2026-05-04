import api from './axios';

// ─── Demandes Agent ─────────────────────────────────────────
export const getMesDemandes = async () => {
  const response = await api.get('/users/demandes/');
  return response.data;
};

export const creerDemande = async (data) => {
  const response = await api.post('/users/demandes/', data);
  return response.data;
};

// ─── Demandes Admin ─────────────────────────────────────────
export const getDemandesAdmin = async () => {
  const response = await api.get('/users/demandes/admin/');
  return response.data;
};

export const traiterDemandeAdmin = async (id, data) => {
  const response = await api.put(`/users/demandes/admin/${id}/`, data);
  return response.data;
};

// ─── Demandes Admin IT ──────────────────────────────────────
export const getDemandesIT = async (statut = 'approuvee') => {
  const response = await api.get(`/users/demandes/it/?statut=${statut}`);
  return response.data;
};

export const traiterDemandeIT = async (id, data) => {
  const response = await api.put(`/users/demandes/it/${id}/`, data);
  return response.data;
};
