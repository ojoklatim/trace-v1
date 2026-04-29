import { AlertTriangle, X } from 'lucide-react'
import { useState } from 'react'
import './WarningBanner.css'

function WarningBanner({ rainIntensity, lang }) {
  const [dismissedIntensity, setDismissedIntensity] = useState(0)
  
  // If intensity drops below threshold, reset dismissal so it can reappear if it rains again
  if (rainIntensity <= 2.0 && dismissedIntensity !== 0) {
    setDismissedIntensity(0)
  }

  const isVisible = rainIntensity > 2.0 && dismissedIntensity !== rainIntensity

  if (!isVisible) return null

  return (
    <div className={`warning-banner ${rainIntensity > 5.0 ? 'warning--critical' : 'warning--high'}`}>
      <div className="warning-content">
        <AlertTriangle size={20} className="warning-icon" />
        <div className="warning-text">
          <strong>
            {lang === 'en' ? 'HEAVY RAINFALL ALERT' : 'OKULABULA: ENKUBA ENNYI'}
          </strong>
          <span>
            {lang === 'en' 
              ? `${rainIntensity.toFixed(1)}mm/hr detected. Localized flooding risk is rising across low-lying Kampala corridors.` 
              : `${rainIntensity.toFixed(1)}mm/hr ekutte. Obulabe bw'okujjula amazzi buli kuyingira mu bitundu ebiri wansi mu Kampala.`}
          </span>
        </div>
      </div>
      <button className="warning-close" onClick={() => setDismissedIntensity(rainIntensity)}>
        <X size={18} />
      </button>
    </div>
  )
}

export default WarningBanner
