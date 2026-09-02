import api from './axios'

export const lotApi = {
  create: async (lotData) => {
    console.log('📤 Creating lot with data:', lotData)
    try {
      const response = await api.post('/lots', lotData)
      return response
    } catch (error) {
      console.error('❌ Lot creation API error:', error.response?.data)
      throw error
    }
  },
  
  getAll: () => api.get('/lots'),
  
  getById: (id) => api.get(`/lots/${id}`),
  
  getByLotId: (lotId) => api.get(`/lots/lot/${lotId}`),
}
