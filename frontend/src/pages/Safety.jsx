import React, { useState, useEffect, useMemo } from 'react'
import { useTranslation } from '../hooks/useTranslation'
import './Safety.css'

const Safety = () => {
  const { t } = useTranslation()
  const [safetyData, setSafetyData] = useState(null)
  const [loading, setLoading] = useState(true)

  const data = useMemo(
    () => ({
      general: [
        { icon: '🧤', title: t('safety.wearGloves'), description: t('safety.glovesDesc') },
        { icon: '😷', title: t('safety.respiratory'), description: t('safety.respiratoryDesc') },
        { icon: '🧼', title: t('safety.washHands'), description: t('safety.washHandsDesc') },
        { icon: '🚫', title: t('safety.keepAway'), description: t('safety.keepAwayDesc') },
        { icon: '💨', title: t('safety.ventilate'), description: t('safety.ventilateDesc') },
        { icon: '🔥', title: t('safety.avoidHeat'), description: t('safety.avoidHeatDesc') },
        { icon: '📦', title: t('safety.properStorage'), description: t('safety.properStorageDesc') },
        { icon: '♻️', title: t('safety.separateMaterials'), description: t('safety.separateMaterialsDesc') }
      ],
      materials: [
        {
          key: 'battery',
          icon: '🔋',
          color: '#f44336',
          guidanceCount: 7,
          warningsCount: 3
        },
        {
          key: 'crt',
          icon: '🖥️',
          color: '#ff9800',
          guidanceCount: 7,
          warningsCount: 3
        },
        {
          key: 'pcb',
          icon: '💻',
          color: '#2196f3',
          guidanceCount: 6,
          warningsCount: 3
        },
        {
          key: 'cable',
          icon: '🔌',
          color: '#4caf50',
          guidanceCount: 6,
          warningsCount: 2
        },
        {
          key: 'lcd',
          icon: '📱',
          color: '#9c27b0',
          guidanceCount: 6,
          warningsCount: 3
        },
        {
          key: 'motor',
          icon: '⚡',
          color: '#ff5722',
          guidanceCount: 6,
          warningsCount: 3
        }
      ]
    }),
    [t]
  )

  useEffect(() => {
    setSafetyData(data)
    setLoading(false)
  }, [data])

  if (loading) return <div className="loading-state">{t('common.loading')}</div>
  if (!safetyData) return null

  return (
    <div className="safety-page">
      <h1 className="page-title">{t('safety.title')}</h1>
      <p className="page-subtitle text-muted">{t('safety.subtitle')}</p>

      <div className="general-safety card">
        <h3>{t('safety.generalTips')}</h3>
        <div className="safety-tips-grid">
          {safetyData.general.map((tip, index) => (
            <div key={index} className="safety-tip">
              <span className="tip-icon">{tip.icon}</span>
              <div>
                <strong>{tip.title}</strong>
                <p className="tip-description">{tip.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="material-safety">
        <h3 className="section-title">{t('safety.materialSpecific')}</h3>
        <div className="safety-grid">
          {safetyData.materials.map((material) => (
            <div
              key={material.key}
              className="card safety-card"
              style={{ borderLeftColor: material.color }}
            >
              <div className="safety-header">
                <span className="safety-icon">{material.icon}</span>
                <h4>{t(`safety.mat.${material.key}.name`)}</h4>
              </div>

              <div className="safety-guidance-list">
                {Array.from({ length: material.guidanceCount }, (_, i) => i + 1).map((n) => (
                  <div key={n} className="guidance-item">
                    {t(`safety.mat.${material.key}.g${n}`)}
                  </div>
                ))}
              </div>

              <div className="safety-warnings">
                <strong>{t('safety.warnings')}</strong>
                <div className="warning-tags">
                  {Array.from({ length: material.warningsCount }, (_, i) => i + 1).map((n) => (
                    <span key={n} className="warning-tag">
                      {t(`safety.mat.${material.key}.w${n}`)}
                    </span>
                  ))}
                </div>
              </div>

              <div className="emergency-info">
                <strong>{t('safety.emergency')}</strong>
                <p>{t(`safety.mat.${material.key}.em`)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Safety
