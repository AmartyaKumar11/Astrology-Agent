import { apiRequest } from './api.js';

export const hilService = {
  getPending() {
    return apiRequest('/hil/pending');
  },

  decide(consultationId, payload) {
    return apiRequest(`/consultations/${consultationId}/hil/decision`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

