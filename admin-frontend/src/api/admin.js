import http from './request'

// ===== Auth =====
export const adminLogin = (username, password) =>
  http.post('/v2/admin/auth/login', { username, password })

// ===== Categories =====
export const getCategories = (type) =>
  http.get('/v2/admin/categories', { params: { type } })

export const getActiveCategories = (type) =>
  http.get('/v2/admin/categories/active', { params: { type } })

export const createCategory = (data) =>
  http.post('/v2/admin/categories', data)

export const updateCategory = (id, data) =>
  http.put(`/v2/admin/categories/${id}`, data)

export const deleteCategory = (id) =>
  http.delete(`/v2/admin/categories/${id}`)

// ===== Materials =====
export const getMaterials = (params) =>
  http.get('/v2/admin/materials', { params })

export const createMaterial = (data) =>
  http.post('/v2/admin/materials', data)

export const updateMaterial = (id, data) =>
  http.put(`/v2/admin/materials/${id}`, data)

export const updateMaterialStatus = (id, status) =>
  http.put(`/v2/admin/materials/${id}/status`, null, { params: { status } })

export const deleteMaterial = (id) =>
  http.delete(`/v2/admin/materials/${id}`)

export const uploadImage = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return http.post('/v2/admin/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// ===== Text Assets =====
export const getTextAssets = params => http.get('/v2/admin/text-assets', { params })
export const createTextAsset = data => http.post('/v2/admin/text-assets', data)
export const updateTextAsset = (id, data) => http.put(`/v2/admin/text-assets/${id}`, data)
export const updateTextAssetStatus = (id, status) => http.put(`/v2/admin/text-assets/${id}/status`, null, { params: { status } })
export const batchUpdateTextAssetStatus = (ids, status) => http.put('/v2/admin/text-assets/batch-status', { ids, status })
export const importTextAssets = items => http.post('/v2/admin/text-assets/import', { items })
export const deleteTextAsset = id => http.delete(`/v2/admin/text-assets/${id}`)

// ===== Users =====
export const getUsers = (params) =>
  http.get('/v2/admin/users', { params })

export const updateUserStatus = (id, status) =>
  http.put(`/v2/admin/users/${id}/status`, null, { params: { status } })

export const updateUserMember = (id, data) =>
  http.put(`/v2/admin/users/${id}/member`, data)

// ===== Redeem Codes =====
export const getRedeemCodes = (params) =>
  http.get('/v2/admin/redeem-codes', { params })

export const generateRedeemCodes = (data) =>
  http.post('/v2/admin/redeem-codes/generate', data)

export const disableRedeemCode = (id) =>
  http.put(`/v2/admin/redeem-codes/${id}/disable`)

// ===== Feedbacks =====
export const getFeedbacks = (params) =>
  http.get('/v2/admin/feedbacks', { params })

export const updateFeedbackStatus = (id, status) =>
  http.put(`/v2/admin/feedbacks/${id}/status`, null, { params: { status } })

export const deleteFeedback = (id) =>
  http.delete(`/v2/admin/feedbacks/${id}`)
