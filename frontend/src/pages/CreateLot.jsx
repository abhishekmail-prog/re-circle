import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaCamera, FaTrash, FaRobot, FaCheck, FaSpinner, FaPlus } from 'react-icons/fa'
import { lotApi } from '../api/lots'
import aiApi from '../api/ai'
import { useOffline } from '../context/OfflineContext'
import { useTranslation } from '../hooks/useTranslation'
import './CreateLot.css'

const MAX_PHOTOS = 10

let _pid = 0
const nextPid = () => ++_pid

const CreateLot = () => {
  const navigate = useNavigate()
  const { isOnline, addPendingAction } = useOffline()
  const { t } = useTranslation()
  const fileInputRef = useRef(null)

  const [loading, setLoading] = useState(false)
  const [photos, setPhotos] = useState([])
  const [aiSuggestion, setAiSuggestion] = useState(null)
  const [aiStatus, setAiStatus] = useState('')
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
    'CRT': 130, 'LCD Panel': 100, 'PCB': 425, 'Cable': 450,
    'Battery': 120, 'Motor': 50, 'Magnet-bearing assembly': 60,
    'Mixed plastic': 15, 'Mobile phone': 320, 'Laptop': 280,
    'Other e-waste': 100
  }

  const CONDITION_MULTIPLIER = { GOOD: 1.0, MIXED: 0.7, DAMAGED: 0.4 }

  const indicativeValue =
    formData.weightKg && parseFloat(formData.weightKg) > 0
      ? (DEFAULT_PRICE_PER_KG[formData.materialCategoryName] || 100) *
        parseFloat(formData.weightKg) *
        (CONDITION_MULTIPLIER[formData.condition] || 1.0)
      : 0

  const categories = [
    'CRT', 'LCD Panel', 'PCB', 'Cable', 'Battery', 'Motor',
    'Magnet-bearing assembly', 'Mixed plastic', 'Mobile phone',
    'Laptop', 'Other e-waste'
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

  const handlePhotoClick = () => fileInputRef.current?.click()

  const handleFilesSelect = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const room = MAX_PHOTOS - photos.length
    if (room <= 0) {
      alert(`Maximum ${MAX_PHOTOS} photos`)
      return
    }
    const toAdd = files.slice(0, room)

    const newPhotos = toAdd.map((f) => ({
      id: nextPid(),
      file: f,
      preview: URL.createObjectURL(f),
      imageUrl: null,
      status: 'uploading',
      error: null
    }))
    setPhotos((prev) => [...prev, ...newPhotos])
    if (fileInputRef.current) fileInputRef.current.value = ''

    setAiStatus(t('createLot.analyzing'))
    setAiError(null)

    // Upload each photo in parallel
    const results = await Promise.all(
      newPhotos.map(async (p) => {
        try {
          const res = await aiApi.classify(p.file)
          setPhotos((prev) =>
            prev.map((x) =>
              x.id === p.id ? { ...x, imageUrl: res.imageUrl, status: 'done' } : x
            )
          )
          return { id: p.id, category: res.suggestedCategory, confidence: res.confidence }
        } catch (err) {
          console.error('Upload failed:', err)
          setPhotos((prev) =>
            prev.map((x) =>
              x.id === p.id ? { ...x, status: 'error', error: 'Upload failed' } : x
            )
          )
          return null
        }
      })
    )

    setAiStatus('')

    // Take highest-confidence suggestion
    const best = results
      .filter((r) => r && r.category)
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0]

    if (best) {
      setAiSuggestion({
        category: best.category,
        confidence: best.confidence,
        source: 'filename'
      })
    } else {
      setAiError(t('createLot.aiError'))
    }
  }

  const handleRemovePhoto = (id) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id))
  }

  const handleUseSuggestion = () => {
    if (!aiSuggestion) return
    setFormData((fd) => ({ ...fd, materialCategoryName: aiSuggestion.category }))
    setAiSuggestion(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.weightKg || parseFloat(formData.weightKg) <= 0) {
      alert(t('createLot.weightError'))
      return
    }

    const donePhotos = photos.filter((p) => p.status === 'done' && p.imageUrl)
    if (donePhotos.length === 0) {
      alert('Please add at least one photo')
      return
    }

    setLoading(true)

    const imageUrls = donePhotos.map((p) => p.imageUrl)
    const lotData = {
      materialCategoryName: formData.materialCategoryName,
      description: formData.description || '',
      weightKg: parseFloat(formData.weightKg),
      condition: formData.condition,
      sourceType: formData.sourceType,
      collectionAddress: formData.collectionAddress || 'Mumbai, Maharashtra',
      collectionLatitude: 19.076,
      collectionLongitude: 72.8777,
      imageUrl: imageUrls[0],
      imageUrls
    }

    try {
      const response = await lotApi.create(lotData)
      console.log('Lot created:', response.data)
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
        alert(t('createLot.offlineSuccess'))
        navigate('/dashboard')
        return
      }
      alert(t('createLot.error', { error: error.message || 'Unknown' }))
    } finally {
      setLoading(false)
    }
  }

  const uploadingCount = photos.filter((p) => p.status === 'uploading').length
  const doneCount = photos.filter((p) => p.status === 'done').length
  const canAddMore = photos.length < MAX_PHOTOS

  return (
    <div className="create-lot">
      <h1 className="page-title">📸 {t('createLot.title')}</h1>
      <p className="page-subtitle text-muted">{t('createLot.subtitle')}</p>

      <form onSubmit={handleSubmit} className="lot-form">

        {/* Photo upload */}
        <div className="form-group">
          <label>
            {t('createLot.takePhoto')}
            <span className="photo-counter">
              {photos.length}/{MAX_PHOTOS}
            </span>
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            style={{ display: 'none' }}
            onChange={handleFilesSelect}
          />

          {photos.length === 0 ? (
            <div className="image-upload-area" onClick={handlePhotoClick}>
              <FaCamera style={{ fontSize: '2.2rem', color: '#2e7d32' }} />
              <p style={{ marginTop: '10px', fontWeight: 500 }}>
                {t('createLot.clickToUpload')}
              </p>
              <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                {t('createLot.aiHint')} — up to {MAX_PHOTOS} photos
              </p>
            </div>
          ) : (
            <div className="photo-grid">
              {photos.map((p) => (
                <div key={p.id} className="photo-tile">
                  <img src={p.preview} alt="" />
                  {p.status === 'uploading' && (
                    <div className="photo-overlay">
                      <FaSpinner className="spin" />
                    </div>
                  )}
                  {p.status === 'error' && (
                    <div className="photo-overlay error">
                      <span>⚠️</span>
                    </div>
                  )}
                  {p.status === 'done' && (
                    <div className="photo-overlay done">
                      <FaCheck />
                    </div>
                  )}
                  <button
                    type="button"
                    className="photo-remove"
                    onClick={() => handleRemovePhoto(p.id)}
                    title={t('createLot.removeImage')}
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}

              {canAddMore && (
                <button
                  type="button"
                  className="photo-tile photo-add"
                  onClick={handlePhotoClick}
                  title="Add more photos"
                >
                  <FaPlus />
                  <span>Add</span>
                </button>
              )}
            </div>
          )}

          {uploadingCount > 0 && (
            <div className="ai-status-row">
              <FaSpinner className="spin" /> {aiStatus || t('createLot.analyzing')}
            </div>
          )}

          {doneCount > 0 && !aiSuggestion && !uploadingCount && (
            <div className="ai-status-row done">
              <FaCheck /> {doneCount} photo{doneCount > 1 ? 's' : ''} uploaded
            </div>
          )}

          {aiSuggestion && (
            <div className="ai-suggest">
              <span>
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

          {aiError && <div className="ai-error">⚠️ {aiError}</div>}
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
                <option key={cond.value} value={cond.value}>{cond.label}</option>
              ))}
            </select>
          </div>
        </div>

        {indicativeValue > 0 && (
          <div className="indicative-box">
            💡 Indicative market value:{' '}
            <strong>₹{Math.round(indicativeValue).toLocaleString()}</strong>
            <div className="indicative-note">
              {formData.condition !== 'GOOD' && (
                <span>
                  {formData.condition === 'MIXED' ? 'Mixed' : 'Damaged'} condition
                  → {formData.condition === 'MIXED' ? '70%' : '40%'} of full value.{' '}
                </span>
              )}
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
          disabled={loading || doneCount === 0}
        >
          {loading ? t('createLot.creating') : t('createLot.create')}
        </button>
      </form>
    </div>
  )
}

export default CreateLot
