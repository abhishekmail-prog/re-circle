import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { lotApi } from '../api/lots'
import { useOffline } from '../context/OfflineContext'
import './CreateLot.css'

const CreateLot = () => {
  const navigate = useNavigate()
  const { isOnline, addPendingAction } = useOffline()
  const [loading, setLoading] = useState(false)
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

    try {
      const response = await lotApi.create(lotData)
      console.log('✅ Lot created:', response.data)
      toast.success('🎉 Lot created successfully!')
      navigate(`/lot/${response.data.lotId}`)
    } catch (error) {
      console.error('❌ Create lot error:', error)
      toast.error('Failed to create lot. Please try again.')
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
          <label>Material Category *</label>
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

        <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
          {loading ? 'Creating...' : '📸 Create Lot & Get QR Code'}
        </button>
      </form>
    </div>
  )
}

export default CreateLot
