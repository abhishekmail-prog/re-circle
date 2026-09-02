import api from './axios'

export const recyclerApi = {
  getAll: () => api.get('/recyclers'),
  getNearby: (lat, lng) => api.get(`/recyclers/nearby?lat=${lat}&lng=${lng}`),
  getById: (id) => api.get(`/recyclers/${id}`),
}
