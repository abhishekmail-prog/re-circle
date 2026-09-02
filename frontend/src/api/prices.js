import api from './axios'

export const priceApi = {
  getPrices: (category) => api.get(`/prices?category=${category}`),
  getTrends: (category) => api.get(`/prices/trends?category=${category}`),
}
