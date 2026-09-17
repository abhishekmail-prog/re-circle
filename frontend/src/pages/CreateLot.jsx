import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { lotApi } from '../api/lots'
import { useOffline } from '../context/OfflineContext'
import { useTranslation } from '../hooks/useTranslation'
import './CreateLot.css'

const CreateLot = () => {
  const navigate = useNavigate()
  const { isOnline, addPendingAction } = useOffline()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    materialCategoryName: 'PCB',
    description: '',
    weightKg: '',
    condition: 'GOOD',
    sourceType: 'HOUSEHOLD',
    collectionAddress: 'Mumbai, Maharashtra'
  })

  const categories = [
    'CRT',
    'LCD Panel',
    'PCB',
    'Cable',
    'Battery',
    'Motor',
    'Mixed plastic',
    'Mobile phone',
    'Laptop',
    'Other e-waste'
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

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.weightKg || parseFloat(formData.weightKg) <= 0) {
      console.error(t('createLot.weightError'))
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
      collectionLongitude: 72.8777
    }

    try {
      if (!isOnline) {
        // offline queue (your OfflineContext handles this)
        addPendingAction({ type: 'CREATE_LOT', payload: lotData })
        console.log(t('createLot.offlineSuccess'))
        alert(t('createLot.offlineSuccess'))
        navigate('/dashboard')
        return
      }

      const response = await lotApi.create(lotData)
      console.log('Lot created:', response.data)
      console.log(t('createLot.success'))
      navigate(`/lot/${response.data.lotId}`)
    } catch (error) {
      console.error('Create lot error:', error)
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
              <option key={cat} value={cat}>
                {cat}
              </option>
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
                <option key={cond.value} value={cond.value}>
                  {cond.label}
                </option>
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
              <option key={src.value} value={src.value}>
                {src.label}
              </option>
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
