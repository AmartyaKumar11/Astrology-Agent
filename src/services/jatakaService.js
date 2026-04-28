import { apiRequest } from './api.js';

export const jatakaService = {
  getDaily(id, month) {
    const suffix = month ? `?month=${encodeURIComponent(month)}` : '';
    return apiRequest(`/consultations/${id}/jataka/daily${suffix}`);
  },

  getWeekly(id) {
    return apiRequest(`/consultations/${id}/jataka/weekly`);
  },

  getMonthly(id) {
    return apiRequest(`/consultations/${id}/jataka/monthly`);
  },
};

