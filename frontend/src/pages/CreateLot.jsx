import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { lotApi } from '../api/lots'
import { useOffline } from '../context/OfflineContext'
import api from '../api/axios'
import './CreateLot.css'

const CreateLot = () => {
  const navigate = useNavigate()
  const { isOnline, addPendingAction } = useOffline()
  const fileInputRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [isClassifying, setIsClassifying] = useState(false)
  const [formData, setFormData] = useState({
    materialCategoryName: 'PCB',
    description: '',
    weightKg: '',
    condition: 'GOOD',
    sourceType: 'HOUSEHOLD',
    collectionAddress: 'Mumbai, Maharashtra'
  })

  const categories = ['CRT', 'LCD Panel', 'PCB', 'Cable', 'Battery', 'Motor', 'Mixed plastic', 'Mobile phone', 'Laptop', 'Other e-waste']
  const conditions = ['GOOD', 'MIXED', 'DAMAGED']
  const sources = ['HOUSEHOLD', 'SHOP', 'BUSINESS', 'OTHER']

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result)
    }
    reader.readAsDataURL(file)

    setImage(file)
    setIsClassifying(true)

    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await api.post('/ai/classify', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      const result = response.data
      if (result.suggestedCategory) {
        setFormData(prev => ({
          ...prev,
          materialCategoryName: result.suggestedCategory
        }))
        toast.success(`🤖 AI suggests: ${result.suggestedCategory} (${result.confidence}% confidence)`)
      }
    } catch (error) {
      console.error('Classification error:', error)
      toast.error('Failed to classify image. Please select category manually.')
    } finally {
      setIsClassifying(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.weightKg || parseFloat(formData.weightKg) <= 0) {
      toast.error('Please enter a valid weight')
      return
    }

    setLoading(true)

    const lotData = {
      materialCategoryName: formData.materialCategoryName,
      description: formData.description || '',
      weightKg: parseFloat(formData.weightKg),
      condition: formData.condition,
      sourceType: formData.sourceType,
      collectionAddress: formData.collectionAddress || 'Mumbai, Maharashtra',
      collectionLatitude: 19.0760,
      collectionLongitude: 72.8777
    }

    console.log('📤 Sending lot data:', lotData)

    try {
      if (isOnline) {
        const response = await lotApi.create(lotData)
        console.log('✅ Lot created:', response.data)
        toast.success('🎉 Lot created successfully!')
        // Wait a moment before navigating
        setTimeout(() => {
          navigate(`/lot/${response.data.lotId}`)
        }, 500)
      } else {
        await addPendingAction({
          type: 'CREATE_LOT',
          data: lotData
        })
        toast.success('💾 Lot saved offline! Will sync when online.')
        navigate('/dashboard')
      }
    } catch (error) {
      console.error('❌ Create lot error:', error)
      
      // Check if it's an auth error
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error('Session expired. Please login again.')
        setTimeout(() => {
          window.location.href = '/login'
        }, 1000)
      } else {
        const errorMessage = error.response?.data || error.message || 'Unknown error'
        toast.error(`Failed to create lot: ${errorMessage}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-lot">
      <h1 className="page-title">📸 Create Digital Lot</h1>
      <p className="page-subtitle text-muted">Document your e-waste and get a QR code for handover</p>

      <form onSubmit={handleSubmit} className="lot-form">
        <div className="form-group">
          <label>📷 Upload Photo (AI will suggest category)</label>
          <div 
            className="image-upload-area"
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed var(--border)',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
              cursor: 'pointer',
              background: imagePreview ? 'transparent' : '#f5f9f5',
              minHeight: '150px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" style={{ maxHeight: '200px', borderRadius: '8px' }} />
            ) : (
              <>
                <span style={{ fontSize: '48px' }}>📸</span>
                <p style={{ margin: '8px 0 4px' }}>Click to upload photo</p>
                <small className="text-muted">AI will suggest material category</small>
              </>
            )}
            {isClassifying && (
              <div style={{ marginTop: '8px', color: '#2e7d32' }}>
                🤖 Analyzing image...
              </div>
            )}
            {imagePreview && !isClassifying && (
              <button 
                type="button" 
                className="btn btn-outline btn-sm" 
                style={{ marginTop: '8px' }}
                onClick={(e) => { e.stopPropagation(); setImagePreview(null); setImage(null) }}
              >
                Remove Image
              </button>
            )}
          </div>
        </div>

        <div className="form-group">
          <label>Material Category *</label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              name="materialCategoryName"
              className="form-control"
              value={formData.materialCategoryName}
              onChange={handleChange}
              required
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {isClassifying && (
              <span className="badge badge-warning">🤖 AI Analyzing...</span>
            )}
          </div>
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            className="form-control"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe the material (optional)"
            rows="3"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Weight (kg) *</label>
            <input
              type="number"
              name="weightKg"
              className="form-control"
              value={formData.weightKg}
              onChange={handleChange}
              placeholder="e.g., 5"
              min="0.1"
              step="0.1"
              required
            />
          </div>

          <div className="form-group">
            <label>Condition *</label>
            <select
              name="condition"
              className="form-control"
              value={formData.condition}
              onChange={handleChange}
              required
            >
              {conditions.map((cond) => (
                <option key={cond} value={cond}>{cond}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Source Type</label>
          <select
            name="sourceType"
            className="form-control"
            value={formData.sourceType}
            onChange={handleChange}
          >
            {sources.map((src) => (
              <option key={src} value={src}>{src}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Location</label>
          <input
            type="text"
            name="collectionAddress"
            className="form-control"
            value={formData.collectionAddress}
            onChange={handleChange}
            placeholder="Enter your location"
          />
        </div>

        {!isOnline && (
          <div className="offline-warning">
            ⚠️ You are offline. This lot will be saved and synced when you're back online.
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
          {loading ? 'Creating...' : '📸 Create Lot & Get QR Code'}
        </button>
      </form>
    </div>
  )
}

export default CreateLot
