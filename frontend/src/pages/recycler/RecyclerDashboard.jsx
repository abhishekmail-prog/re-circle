import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { FaBox, FaMoneyBillWave, FaCheckCircle, FaClock, FaEye, FaCheck, FaTrash } from 'react-icons/fa'
import './RecyclerDashboard.css'

const RecyclerDashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    incomingLots: 4,
    pendingHandovers: 3,
    completedTransactions: 0,
    totalEarnings: 0
  })
  const [incomingLots, setIncomingLots] = useState([
    { id: 1, lotId: 'RC-2024-000001', materialCategory: { name: 'PCB' }, weightKg: 5, status: 'MATCHED', collector: 'Ramesh Kumar' },
    { id: 2, lotId: 'RC-2024-000002', materialCategory: { name: 'Battery' }, weightKg: 3, status: 'MATCHED', collector: 'Priya Singh' },
    { id: 3, lotId: 'RC-2024-000003', materialCategory: { name: 'LCD Panel' }, weightKg: 8, status: 'PICKUP_SCHEDULED', collector: 'Amit Patel' },
    { id: 4, lotId: 'RC-2024-000004', materialCategory: { name: 'Cable' }, weightKg: 12, status: 'MATCHED', collector: 'Sneha Sharma' },
  ])
  const [completedLots, setCompletedLots] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedLot, setSelectedLot] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [handoverCount, setHandoverCount] = useState(0)

  const handleViewLot = (lot) => {
    setSelectedLot(lot)
    setShowModal(true)
  }

  const handleConfirmHandover = async () => {
    if (!selectedLot) return
    
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const earnings = Math.round(selectedLot.weightKg * 400 + Math.random() * 500)
      
      setIncomingLots(prev => prev.filter(lot => lot.id !== selectedLot.id))
      
      const completedLot = {
        ...selectedLot,
        status: 'COMPLETED',
        handoverDate: new Date().toLocaleString(),
        earnings: earnings
      }
      setCompletedLots(prev => [...prev, completedLot])
      
      setStats(prev => ({
        incomingLots: prev.incomingLots - 1,
        pendingHandovers: Math.max(0, prev.pendingHandovers - 1),
        completedTransactions: prev.completedTransactions + 1,
        totalEarnings: prev.totalEarnings + earnings
      }))
      
      setHandoverCount(prev => prev + 1)
      
      toast.success(`✅ Handover confirmed! ₹${earnings} earned.`)
      setShowModal(false)
      setSelectedLot(null)
      
    } catch (error) {
      toast.error('Failed to confirm handover')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCompleted = (id) => {
    setCompletedLots(prev => prev.filter(lot => lot.id !== id))
    toast.success('Removed from history')
  }

  const quickActions = [
    { icon: FaBox, label: 'Incoming Lots', color: '#2196f3', count: stats.incomingLots },
    { icon: FaClock, label: 'Pending Handovers', color: '#ff9800', count: stats.pendingHandovers },
    { icon: FaCheckCircle, label: 'Completed', color: '#4caf50', count: stats.completedTransactions },
    { icon: FaMoneyBillWave, label: 'Total Revenue', color: '#9c27b0', value: `₹${stats.totalEarnings}` },
  ]

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
        <h1>🏭 Welcome, {user?.fullName || 'Recycler'}!</h1>
        <p className="text-muted">Manage incoming e-waste lots and handovers</p>
        {handoverCount > 0 && (
          <p className="text-muted" style={{ color: '#4caf50', fontWeight: 500 }}>
            ✅ {handoverCount} handover{handoverCount > 1 ? 's' : ''} completed today!
          </p>
        )}
      </div>

      <div className="stats-grid">
        {quickActions.map((action, index) => (
          <div key={index} className="stat-card" style={{ borderColor: action.color }}>
            <div className="stat-icon" style={{ color: action.color }}>
              <action.icon />
            </div>
            <div className="stat-content">
              <span className="stat-label">{action.label}</span>
              <span className="stat-value">{action.count || action.value || 0}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="card incoming-lots">
        <h3>📦 Incoming Lots ({incomingLots.length})</h3>
        {incomingLots.length === 0 ? (
          <div className="empty-state">
            <span style={{ fontSize: '48px' }}>🎉</span>
            <p>No incoming lots</p>
            <p className="text-muted" style={{ fontSize: '13px' }}>All lots processed!</p>
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
                </div>
                <div className="lot-actions">
                  <span className={`badge ${getStatusBadge(lot.status)}`}>
                    {lot.status}
                  </span>
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => handleViewLot(lot)}
                  >
                    <FaEye /> View & Confirm
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {completedLots.length > 0 && (
        <div className="card completed-lots">
          <h3>✅ Completed Handovers ({completedLots.length})</h3>
          <div className="completed-list">
            {completedLots.map((lot) => (
              <div key={lot.id} className="completed-item">
                <div className="completed-info">
                  <span className="lot-id">{lot.lotId}</span>
                  <span className="lot-material">{lot.materialCategory?.name}</span>
                  <span className="lot-weight">{lot.weightKg} kg</span>
                  <span className="lot-earnings">💰 ₹{lot.earnings}</span>
                </div>
                <div className="completed-actions">
                  <span className="completed-time">{lot.handoverDate}</span>
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDeleteCompleted(lot.id)}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && selectedLot && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📋 Confirm Handover</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-details">
                <div className="modal-row">
                  <span className="modal-label">Lot ID:</span>
                  <span className="modal-value">{selectedLot.lotId}</span>
                </div>
                <div className="modal-row">
                  <span className="modal-label">Material:</span>
                  <span className="modal-value">{selectedLot.materialCategory?.name}</span>
                </div>
                <div className="modal-row">
                  <span className="modal-label">Weight:</span>
                  <span className="modal-value">{selectedLot.weightKg} kg</span>
                </div>
                <div className="modal-row">
                  <span className="modal-label">Collector:</span>
                  <span className="modal-value">{selectedLot.collector}</span>
                </div>
                <div className="modal-row">
                  <span className="modal-label">Status:</span>
                  <span className={`badge ${getStatusBadge(selectedLot.status)}`}>
                    {selectedLot.status}
                  </span>
                </div>
                <div className="modal-row highlight">
                  <span className="modal-label">Estimated Earnings:</span>
                  <span className="modal-value">
                    ₹{Math.round(selectedLot.weightKg * 400 + Math.random() * 500)}
                  </span>
                </div>
              </div>
              <div className="modal-actions">
                <button 
                  className="btn btn-success btn-block"
                  onClick={handleConfirmHandover}
                  disabled={loading}
                >
                  {loading ? 'Confirming...' : <><FaCheck /> Confirm Handover</>}
                </button>
                <button 
                  className="btn btn-outline btn-block"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RecyclerDashboard
