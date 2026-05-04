import api from './axios';

export const loginClient = async (telephone, mot_de_passe) => {
  const response = await api.post('/users/login/client/', { telephone, mot_de_passe });
  return response.data;
};

export const loginStaff = async (email, mot_de_passe) => {
  const response = await api.post('/users/login/agent/', { email, mot_de_passe });
  return response.data;
};

export const logout = async (refreshToken) => {
  if (refreshToken) {
    try {
      await api.post('/users/logout/', { refresh: refreshToken });
    } catch (e) {
      console.error(e);
    }
  }
};
