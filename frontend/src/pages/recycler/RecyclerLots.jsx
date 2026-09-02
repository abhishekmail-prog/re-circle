import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { FaEye, FaCheck, FaBox, FaClock } from 'react-icons/fa'
import toast from 'react-hot-toast'
import './RecyclerDashboard.css'

const RecyclerLots = () => {
  const { user } = useAuth()
  const [incomingLots, setIncomingLots] = useState([
    { id: 1, lotId: 'RC-2024-000001', materialCategory: { name: 'PCB' }, weightKg: 5, status: 'MATCHED', collector: 'Ramesh Kumar', createdAt: '2024-09-02 10:30' },
    { id: 2, lotId: 'RC-2024-000002', materialCategory: { name: 'Battery' }, weightKg: 3, status: 'MATCHED', collector: 'Priya Singh', createdAt: '2024-09-02 11:45' },
    { id: 3, lotId: 'RC-2024-000003', materialCategory: { name: 'LCD Panel' }, weightKg: 8, status: 'PICKUP_SCHEDULED', collector: 'Amit Patel', createdAt: '2024-09-02 09:20' },
    { id: 4, lotId: 'RC-2024-000004', materialCategory: { name: 'Cable' }, weightKg: 12, status: 'MATCHED', collector: 'Sneha Sharma', createdAt: '2024-09-02 14:00' },
  ])
  const [selectedLot, setSelectedLot] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleViewLot = (lot) => {
    setSelectedLot(lot)
    setShowModal(true)
  }

  const handleConfirmHandover = async () => {
    if (!selectedLot) return
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 800))
      setIncomingLots(prev => prev.filter(lot => lot.id !== selectedLot.id))
      toast.success(`✅ Handover confirmed for ${selectedLot.lotId}`)
      setShowModal(false)
      setSelectedLot(null)
    } catch (error) {
      toast.error('Failed to confirm handover')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      'MATCHED': 'badge-warning',
      'PICKUP_SCHEDULED': 'badge-info',
      'HANDED_OVER': 'badge-success',
      'PAYMENT_PENDING': 'badge-warning',
      'PAID': 'badge-success',
      'COMPLETED': 'badge-success'
    }
    return statusMap[status] || 'badge-info'
  }

  return (
    <div className="recycler-dashboard">
      <div className="dashboard-header">
        <h1>📦 Incoming Lots</h1>
        <p className="text-muted">View and manage all incoming e-waste lots</p>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="stat-card" style={{ borderColor: '#2196f3' }}>
          <div className="stat-icon" style={{ color: '#2196f3' }}><FaBox /></div>
          <div className="stat-content">
            <span className="stat-label">Total Lots</span>
            <span className="stat-value">{incomingLots.length}</span>
          </div>
        </div>
        <div className="stat-card" style={{ borderColor: '#ff9800' }}>
          <div className="stat-icon" style={{ color: '#ff9800' }}><FaClock /></div>
          <div className="stat-content">
            <span className="stat-label">Pending</span>
            <span className="stat-value">{incomingLots.filter(l => l.status === 'MATCHED').length}</span>
          </div>
        </div>
      </div>

      <div className="card incoming-lots">
        <h3>📋 All Lots ({incomingLots.length})</h3>
        {incomingLots.length === 0 ? (
          <div className="empty-state">
            <span style={{ fontSize: '48px' }}>🎉</span>
            <p>No lots available</p>
          </div>
        ) : (
          <div className="lots-list">
            {incomingLots.map((lot) => (
              <div key={lot.id} className="lot-item">
                <div className="lot-info">
                  <span className="lot-id">{lot.lotId}</span>
                  <span className="lot-material">{lot.materialCategory?.name}</span>
                  <span className="lot-weight">{lot.weightKg} kg</span>
                  <span className="lot-collector">👤 {lot.collector}</span>
                  <span className="lot-time">{lot.createdAt}</span>
                </div>
                <div className="lot-actions">
                  <span className={`badge ${getStatusBadge(lot.status)}`}>
                    {lot.status}
                  </span>
                  <button className="btn btn-primary btn-sm" onClick={() => handleViewLot(lot)}>
                    <FaEye /> View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && selectedLot && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📋 Lot Details</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-details">
                <div className="modal-row"><span className="modal-label">Lot ID:</span><span className="modal-value">{selectedLot.lotId}</span></div>
                <div className="modal-row"><span className="modal-label">Material:</span><span className="modal-value">{selectedLot.materialCategory?.name}</span></div>
                <div className="modal-row"><span className="modal-label">Weight:</span><span className="modal-value">{selectedLot.weightKg} kg</span></div>
                <div className="modal-row"><span className="modal-label">Collector:</span><span className="modal-value">{selectedLot.collector}</span></div>
                <div className="modal-row"><span className="modal-label">Status:</span><span className={`badge ${getStatusBadge(selectedLot.status)}`}>{selectedLot.status}</span></div>
                <div className="modal-row"><span className="modal-label">Created:</span><span className="modal-value">{selectedLot.createdAt}</span></div>
              </div>
              <div className="modal-actions">
                <button className="btn btn-success btn-block" onClick={handleConfirmHandover} disabled={loading}>
                  {loading ? 'Confirming...' : <><FaCheck /> Confirm Handover</>}
                </button>
                <button className="btn btn-outline btn-block" onClick={() => setShowModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RecyclerLots
