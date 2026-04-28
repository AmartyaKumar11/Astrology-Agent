import { apiRequest } from './api.js';

export const consultationService = {
  list(params = {}) {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
    ).toString();
    const suffix = qs ? `?${qs}` : '';
    return apiRequest(`/consultations${suffix}`);
  },

  getById(id) {
    return apiRequest(`/consultations/${id}`);
  },

  updateStatus(id, status) {
    return apiRequest(`/consultations/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};

