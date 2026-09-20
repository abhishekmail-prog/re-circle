import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaCamera, FaTrash, FaRobot, FaCheck, FaSpinner } from 'react-icons/fa'
import { lotApi } from '../api/lots'
import aiApi from '../api/ai'
import { useOffline } from '../context/OfflineContext'
import { useTranslation } from '../hooks/useTranslation'
import './CreateLot.css'

const CreateLot = () => {
  const navigate = useNavigate()
  const { isOnline, addPendingAction } = useOffline()
  const { t } = useTranslation()
  const fileInputRef = useRef(null)

  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [imageUrl, setImageUrl] = useState(null)
  const [classifying, setClassifying] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState(null) // {category, confidence}
  const [aiError, setAiError] = useState(null)

  const [formData, setFormData] = useState({
    materialCategoryName: 'PCB',
    description: '',
    weightKg: '',
    condition: 'GOOD',
    sourceType: 'HOUSEHOLD',
    collectionAddress: 'Mumbai, Maharashtra'
  })

  const DEFAULT_PRICE_PER_KG = {
    'CRT': 130,
    'LCD Panel': 100,
    'PCB': 425,
    'Cable': 450,
    'Battery': 120,
    'Motor': 50,
    'Magnet-bearing assembly': 60,
    'Mixed plastic': 15,
    'Mobile phone': 320,
    'Laptop': 280,
    'Other e-waste': 100
  }

  const indicativeValue =
    formData.weightKg && parseFloat(formData.weightKg) > 0
      ? (DEFAULT_PRICE_PER_KG[formData.materialCategoryName] || 100) *
        parseFloat(formData.weightKg)
      : 0

  const categories = [
    'CRT','LCD Panel','PCB','Cable','Battery','Motor',
    'Magnet-bearing assembly','Mixed plastic','Mobile phone','Laptop','Other e-waste'
  ]
  const conditions = [
    { value: 'GOOD', label: t('createLot.conditions.good') },
    { value: 'MIXED', label: t('createLot.conditions.mixed') },
    { value: 'DAMAGED', label: t('createLot.conditions.damaged') }
  ]
  const sources = [
    { value: 'HOUSEHOLD', label: t('createLot.sources.household') },
    { value: 'SHOP', label: t('createLot.sources.shop') },
    { value: 'BUSINESS', label: t('createLot.sources.business') },
    { value: 'OTHER', label: t('createLot.sources.other') }
  ]

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // ── Photo upload + AI classification ────────────────────────
  const handlePhotoClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImageFile(file)
    setAiSuggestion(null)
    setAiError(null)

    // Preview immediately
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target.result)
    reader.readAsDataURL(file)

    if (!isOnline) {
      setAiError(t('createLot.aiOffline'))
      return
    }

    // Classify via AI
    setClassifying(true)
    try {
      const result = await aiApi.classify(file)
      console.log('🤖 AI classify result:', result)
      setImageUrl(result.imageUrl)
      setAiSuggestion({
        category: result.suggestedCategory,
        confidence: result.confidence
      })
    } catch (err) {
      console.error('AI classify failed:', err)
      setAiError(t('createLot.aiError'))
    } finally {
      setClassifying(false)
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setImageUrl(null)
    setAiSuggestion(null)
    setAiError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleUseSuggestion = () => {
    if (!aiSuggestion) return
    setFormData({ ...formData, materialCategoryName: aiSuggestion.category })
    setAiSuggestion(null)
  }

  // ── Submit ──────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.weightKg || parseFloat(formData.weightKg) <= 0) {
      alert(t('createLot.weightError'))
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
      collectionLatitude: 19.076,
      collectionLongitude: 72.8777,
      imageUrl: imageUrl || null
    }

    try {
      const response = await lotApi.create(lotData)
      console.log('Lot created:', response.data)
      console.log(t('createLot.success'))
      navigate(`/lot/${response.data.lotId}`)
    } catch (error) {
      console.error('Create lot error:', error)
      const isNetworkError =
        !navigator.onLine ||
        error?.code === 'ERR_NETWORK' ||
        error?.message?.includes('Network Error') ||
        error?.message?.includes('timeout')

      if (isNetworkError) {
        await addPendingAction({ type: 'CREATE_LOT', data: lotData })
        console.log(t('createLot.offlineSuccess'))
        alert(t('createLot.offlineSuccess'))
        navigate('/dashboard')
        return
      }
      alert(t('createLot.error', { error: error.message || 'Unknown' }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-lot">
      <h1 className="page-title">📸 {t('createLot.title')}</h1>
      <p className="page-subtitle text-muted">{t('createLot.subtitle')}</p>

      <form onSubmit={handleSubmit} className="lot-form">

        {/* ─── Photo capture ──────────────────────────────── */}
        <div className="form-group">
          <label>{t('createLot.takePhoto')}</label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />

          {!imagePreview ? (
            <div
              className="image-upload-area"
              onClick={handlePhotoClick}
              style={{
                border: '2px dashed #bdbdbd',
                borderRadius: '10px',
                padding: '32px 16px',
                textAlign: 'center',
                cursor: 'pointer',
                background: '#fafafa'
              }}
            >
              <FaCamera style={{ fontSize: '2.2rem', color: '#2e7d32' }} />
              <p style={{ marginTop: '10px', fontWeight: 500 }}>
                {t('createLot.clickToUpload')}
              </p>
              <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                {t('createLot.aiHint')}
              </p>
            </div>
          ) : (
            <div className="image-preview-wrapper" style={{ position: 'relative' }}>
              <img
                src={imagePreview}
                alt="lot"
                style={{
                  width: '100%',
                  maxHeight: '260px',
                  objectFit: 'cover',
                  borderRadius: '10px',
                  display: 'block'
                }}
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'rgba(0,0,0,0.55)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={t('createLot.removeImage')}
              >
                <FaTrash />
              </button>
            </div>
          )}

          {classifying && (
            <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px', color: '#2e7d32' }}>
              <FaSpinner className="spin" /> {t('createLot.analyzing')}
            </div>
          )}

          {aiSuggestion && (
            <div
              style={{
                marginTop: '10px',
                padding: '12px 16px',
                background: '#e8f5e9',
                border: '1px solid #a5d6a7',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                flexWrap: 'wrap'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaRobot /> {t('createLot.aiSuggestion', {
                  category: aiSuggestion.category,
                  confidence: aiSuggestion.confidence
                })}
              </span>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleUseSuggestion}
              >
                <FaCheck /> {t('createLot.useAiSuggestion')}
              </button>
            </div>
          )}

          {aiError && (
            <div style={{ marginTop: '10px', color: '#b71c1c', fontSize: '0.9rem' }}>
              ⚠️ {aiError}
            </div>
          )}
        </div>

        {/* ─── Rest of the form ───────────────────────────── */}
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
                <option key={cond.value} value={cond.value}>{cond.label}</option>
              ))}
            </select>
          </div>
        </div>

        {indicativeValue > 0 && (
          <div
            style={{
              background: '#e3f2fd',
              border: '1px solid #90caf9',
              color: '#0d47a1',
              padding: '10px 16px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '0.92rem'
            }}
          >
            💡 Indicative market value: <strong>₹{Math.round(indicativeValue).toLocaleString()}</strong>
            <div style={{ fontSize: '0.78rem', marginTop: '4px', color: '#1565c0' }}>
              (auction will determine the final price)
            </div>
          </div>
        )}

        <div className="form-group">
          <label>{t('createLot.sourceType')}</label>
          <select
            name="sourceType"
            className="form-control"
            value={formData.sourceType}
            onChange={handleChange}
          >
            {sources.map((src) => (
              <option key={src.value} value={src.value}>{src.label}</option>
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

        <button
          type="submit"
          className="btn btn-primary btn-block btn-lg"
          disabled={loading}
        >
          {loading ? t('createLot.creating') : t('createLot.create')}
        </button>
      </form>
    </div>
  )
}

export default CreateLot
