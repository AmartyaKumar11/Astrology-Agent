import { apiRequest } from './api.js';

export const reportService = {
  getByConsultationId(id) {
    return apiRequest(`/consultations/${id}/report`);
  },

  generate(id, format = 'pdf') {
    return apiRequest(`/consultations/${id}/report/generate`, {
      method: 'POST',
      body: JSON.stringify({ format }),
    });
  },
};

