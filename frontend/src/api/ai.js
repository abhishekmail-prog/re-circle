import api from './axios'

export const aiApi = {
  classify: async (file) => {
    const form = new FormData()
    form.append('image', file)
    const res = await api.post('/ai/classify', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return res.data
  }
}

export default aiApi
