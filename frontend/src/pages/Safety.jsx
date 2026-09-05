import React, { useState, useEffect } from 'react'
import { useTranslation } from '../hooks/useTranslation'
import './Safety.css'

const Safety = () => {
  const { t } = useTranslation()
  const [safetyData, setSafetyData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const data = {
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
          category: 'Battery',
          icon: '🔋',
          color: '#f44336',
          guidance: [
            '⚠️ Do NOT puncture or pierce batteries',
            '⚠️ Do NOT burn or expose to high heat',
            '⚠️ Do NOT crush or deform batteries',
            '⚠️ Keep away from water and moisture',
            '⚠️ Store in cool, dry place away from flammable materials',
            '⚠️ Tape terminals with non-conductive tape',
            '⚠️ Do NOT attempt to disassemble batteries'
          ],
          warnings: ['☠️ Toxic chemicals can leak', '🔥 Risk of fire or explosion', '💨 Harmful gases when damaged'],
          emergency: '🚨 If battery leaks: Avoid contact. Use gloves. If fire: Use Class D extinguisher.'
        },
        {
          category: 'CRT',
          icon: '🖥️',
          color: '#ff9800',
          guidance: [
            '⚠️ Handle with EXTREME care',
            '⚠️ Do NOT attempt to open CRT casings',
            '⚠️ Risk of implosion if damaged or dropped',
            '⚠️ Contains lead, mercury, and hazardous materials',
            '⚠️ Use appropriate protective equipment',
            '⚠️ Do NOT break CRT glass',
            '⚠️ Store upright and secure'
          ],
          warnings: ['💥 Risk of implosion', '☠️ Contains toxic lead', '⚡ Dangerous high voltage'],
          emergency: '🚨 If broken: Evacuate area. Use proper cleanup. Seek medical attention if exposed.'
        },
        {
          category: 'PCB',
          icon: '💻',
          color: '#2196f3',
          guidance: [
            '⚠️ Do NOT use acid or chemical processing',
            '⚠️ Contains precious metals and hazardous materials',
            '⚠️ Use appropriate PPE (gloves, mask, safety glasses)',
            '⚠️ Avoid breaking boards - releases toxic dust',
            '⚠️ Store in dry, cool location',
            '⚠️ Handle components carefully - sharp edges possible'
          ],
          warnings: ['☠️ Contains lead and mercury', '💨 Toxic dust when broken', '⚡ Risk of electrical shock'],
          emergency: '🚨 If exposed to dust: Use HEPA vacuum. Wear respirator. If burning: Use dry chemical extinguisher.'
        },
        {
          category: 'Cable',
          icon: '🔌',
          color: '#4caf50',
          guidance: [
            '⚠️ Do NOT burn cables to extract copper',
            '⚠️ Separate copper from plastic when possible',
            '⚠️ Avoid contact with water when stripping',
            '⚠️ Use proper wire stripping tools',
            '⚠️ Insulated cables may contain toxic materials',
            '⚠️ Store in organized manner'
          ],
          warnings: ['☠️ Burning releases toxic fumes', '⚠️ Sharp edges when stripped'],
          emergency: '🚨 If burning: Use appropriate fire extinguisher. Avoid smoke inhalation.'
        },
        {
          category: 'LCD Panel',
          icon: '📱',
          color: '#9c27b0',
          guidance: [
            '⚠️ Handle LCD screens with extreme care',
            '⚠️ Do NOT break or shatter LCD panels',
            '⚠️ Contains mercury and hazardous materials',
            '⚠️ Toxic liquid crystal can leak if damaged',
            '⚠️ Use proper storage to prevent cracking',
            '⚠️ Do NOT bend or flex panels'
          ],
          warnings: ['☠️ Contains mercury vapor', '💧 Toxic liquid crystal leaks', '⚠️ Sharp glass fragments'],
          emergency: '🚨 If broken: Ventilate area. Use gloves for cleanup. Wash skin immediately.'
        },
        {
          category: 'Motor',
          icon: '⚡',
          color: '#ff5722',
          guidance: [
            '⚠️ Handle heavy motors with care',
            '⚠️ Discharge capacitors before handling',
            '⚠️ Contains copper, steel, and hazardous materials',
            '⚠️ Check for oil leaks from older motors',
            '⚠️ Use proper lifting techniques',
            '⚠️ Store in dry place to prevent corrosion'
          ],
          warnings: ['⚡ Risk of electrical shock', '💧 Oil contamination possible', '⚠️ Heavy - crush injuries'],
          emergency: '🚨 If shock: Seek immediate medical attention. If oil spill: Use absorbent material.'
        }
      ]
    }
    setSafetyData(data)
    setLoading(false)
  }, [t])

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
          {safetyData.materials.map((material, index) => (
            <div key={index} className="card safety-card" style={{ borderLeftColor: material.color }}>
              <div className="safety-header">
                <span className="safety-icon">{material.icon}</span>
                <h4>{material.category}</h4>
              </div>
              
              <div className="safety-guidance-list">
                {material.guidance.map((item, idx) => (
                  <div key={idx} className="guidance-item">{item}</div>
                ))}
              </div>

              <div className="safety-warnings">
                <strong>{t('safety.warnings')}</strong>
                <div className="warning-tags">
                  {material.warnings.map((warning, idx) => (
                    <span key={idx} className="warning-tag">{warning}</span>
                  ))}
                </div>
              </div>

              {material.emergency && (
                <div className="emergency-info">
                  <strong>{t('safety.emergency')}</strong>
                  <p>{material.emergency}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Safety
