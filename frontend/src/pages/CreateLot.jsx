import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { lotApi } from '../api/lots'
import { useOffline } from '../context/OfflineContext'
import { useTranslation } from '../hooks/useTranslation'
import api from '../api/axios'
import './CreateLot.css'

const CreateLot = () => {
  const { t } = useTranslation()
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
        toast.success(t('createLot.aiSuggestion', { category: result.suggestedCategory, confidence: result.confidence }))
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
      toast.error(t('createLot.weightError'))
      return
    }

    setLoading(true)

    const lotData = {
      ...formData,
      weightKg: parseFloat(formData.weightKg),
      collectionLatitude: 19.0760,
      collectionLongitude: 72.8777
    }

    try {
      if (isOnline) {
        const response = await lotApi.create(lotData)
        toast.success(t('createLot.success'))
        navigate(`/lot/${response.data.lotId}`)
      } else {
        await addPendingAction({
          type: 'CREATE_LOT',
          data: lotData
        })
        toast.success(t('createLot.offlineSuccess'))
        navigate('/dashboard')
      }
    } catch (error) {
      toast.error(t('createLot.error', { error: error.response?.data || error.message }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-lot">
      <h1 className="page-title">{t('createLot.title')}</h1>
      <p className="page-subtitle text-muted">{t('createLot.subtitle')}</p>

      <form onSubmit={handleSubmit} className="lot-form">
        <div className="form-group">
          <label>{t('createLot.takePhoto')}</label>
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
                <p style={{ margin: '8px 0 4px' }}>{t('createLot.clickToUpload')}</p>
                <small className="text-muted">{t('createLot.aiHint')}</small>
              </>
            )}
            {isClassifying && (
              <div style={{ marginTop: '8px', color: '#2e7d32' }}>
                {t('createLot.analyzing')}
              </div>
            )}
            {imagePreview && !isClassifying && (
              <button 
                type="button" 
                className="btn btn-outline btn-sm" 
                style={{ marginTop: '8px' }}
                onClick={(e) => { e.stopPropagation(); setImagePreview(null); setImage(null) }}
              >
                {t('createLot.removeImage')}
              </button>
            )}
          </div>
        </div>

        <div className="form-group">
          <label>{t('createLot.materialCategory')}</label>
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
        </div>

        <div className="form-group">
          <label>{t('createLot.description')}</label>
          <textarea
            name="description"
            className="form-control"
            value={formData.description}
            onChange={handleChange}
            placeholder={t('createLot.descriptionPlaceholder')}
            rows="3"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{t('createLot.weight')}</label>
            <input
              type="number"
              name="weightKg"
              className="form-control"
              value={formData.weightKg}
              onChange={handleChange}
              placeholder={t('createLot.weightPlaceholder')}
              min="0.1"
              step="0.1"
              required
            />
          </div>

          <div className="form-group">
            <label>{t('createLot.condition')}</label>
            <select
              name="condition"
              className="form-control"
              value={formData.condition}
              onChange={handleChange}
              required
            >
              {conditions.map((cond) => (
                <option key={cond} value={cond}>{t(`createLot.conditions.${cond.toLowerCase()}`)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>{t('createLot.sourceType')}</label>
          <select
            name="sourceType"
            className="form-control"
            value={formData.sourceType}
            onChange={handleChange}
          >
            {sources.map((src) => (
              <option key={src} value={src}>{t(`createLot.sources.${src.toLowerCase()}`)}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>{t('createLot.location')}</label>
          <input
            type="text"
            name="collectionAddress"
            className="form-control"
            value={formData.collectionAddress}
            onChange={handleChange}
            placeholder={t('createLot.locationPlaceholder')}
          />
        </div>

        {!isOnline && (
          <div className="offline-warning">
            {t('createLot.offlineWarning')}
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
          {loading ? t('createLot.creating') : t('createLot.create')}
        </button>
      </form>
    </div>
  )
}

export default CreateLot
