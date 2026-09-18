import api from './axios'

export const bidApi = {
  place: (lotId, amountPerKg) =>
    api.post(`/lots/${lotId}/bids`, { amountPerKg }),

  list: (lotId) =>
    api.get(`/lots/${lotId}/bids`),

  accept: (lotId, bidId) =>
    api.post(`/lots/${lotId}/bids/${bidId}/accept`)
}

export default bidApi
