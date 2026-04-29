import { useState, useEffect, useCallback } from 'react'
import { MapPin, Camera, Send, AlertCircle, CheckCircle2 } from 'lucide-react'
import './CommunityPanel.css'

function CommunityPanel() {
  const [reportType, setReportType] = useState('blockage')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [reports, setReports] = useState([])
  const [location, setLocation] = useState(null)
  const [locationLabel, setLocationLabel] = useState('Resolving GPS location...')
  const [photoName, setPhotoName] = useState('No file selected')

  const fetchReports = useCallback(async () => {
    try {
      const res = await fetch('/api/reports')
      if (res.ok) {
        const data = await res.json()
        setReports(data.sort((a, b) => b.timestamp - a.timestamp))
      }
    } catch {
      console.error('Failed to fetch reports')
    }
  }, [])

  const syncOfflineReports = useCallback(async () => {
    const offline = JSON.parse(localStorage.getItem('offline_reports') || '[]')
    if (offline.length === 0) return

    console.log(`Attempting to sync ${offline.length} offline reports...`)
    const remaining = []
    for (const report of offline) {
      try {
        const res = await fetch('/api/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(report)
        })
        if (!res.ok) remaining.push(report)
      } catch {
        remaining.push(report)
      }
    }
    localStorage.setItem('offline_reports', JSON.stringify(remaining))
    if (remaining.length === 0) fetchReports()
  }, [fetchReports])

  useEffect(() => {
    fetchReports()
    syncOfflineReports()
  }, [fetchReports, syncOfflineReports])

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationLabel('Geolocation not supported on this device')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setLocation(nextLocation)
        setLocationLabel(`${nextLocation.lat.toFixed(5)}, ${nextLocation.lng.toFixed(5)}`)
      },
      () => {
        setLocationLabel('Location unavailable. Enable GPS permissions.')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const description = e.target.elements.description?.value?.trim() || ''
    
    const formData = {
      type: reportType,
      description,
      location,
      photo_name: e.target.elements.photo?.files?.[0]?.name || null,
    }

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (response.ok) {
        setSubmitted(true)
      } else {
        throw new Error('Network error')
      }
    } catch {
      console.warn('Network down. Queuing report for background sync...')
      const offline = JSON.parse(localStorage.getItem('offline_reports') || '[]')
      offline.push(formData)
      localStorage.setItem('offline_reports', JSON.stringify(offline))
      setSubmitted(true) // Still show success but with offline note
    } finally {
      setLoading(false)
      fetchReports()
    }
  }

  if (submitted) {
    return (
      <div className="community-success">
        <CheckCircle2 size={48} className="success-icon" />
        <h3>Report {localStorage.getItem('offline_reports') !== '[]' ? 'Queued' : 'Submitted'}</h3>
        <p>
          {localStorage.getItem('offline_reports') !== '[]' 
            ? "You are offline. Your report has been saved and will sync automatically once you reach 3G/WiFi coverage."
            : "Thank you for helping us map drainage health across Greater Kampala. Our team will verify the report."}
        </p>
        <button className="btn-reset" onClick={() => setSubmitted(false)}>Return to Map</button>
      </div>
    )
  }

  return (
    <div className="community-panel">
      <div className="alert-notice">
        <AlertCircle size={16} />
        <span>Crowdsourced data helps refine our Kampala-wide flood risk model.</span>
      </div>

      <h4 className="section-title">Report Infrastructure Issue</h4>
      <form className="report-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Issue Type</label>
          <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
            <option value="blockage">Blocked Drain (Silt/Garbage)</option>
            <option value="broken">Structural Damage (Broken Pipe)</option>
            <option value="overflow">Localized Overflow</option>
            <option value="unmapped">New Drainage Channel</option>
          </select>
        </div>

        <div className="form-group">
          <label>Location</label>
          <div className="location-input">
            <input type="text" value={locationLabel} readOnly />
            <MapPin size={18} className="input-icon" />
          </div>
        </div>

        <div className="form-group">
          <label>Photo Evidence</label>
          <div className="photo-upload">
            <Camera size={24} />
            <input
              type="file"
              name="photo"
              accept="image/*"
              capture="environment"
              onChange={(e) => setPhotoName(e.target.files?.[0]?.name || 'No file selected')}
            />
            <span>{photoName}</span>
          </div>
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea name="description" placeholder="Tell us more about the blockage or damage..."></textarea>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Submitting...' : (
            <>
              <Send size={16} />
              <span>Submit Report</span>
            </>
          )}
        </button>
      </form>

      <div className="recent-reports">
        <h4 className="section-title">Recent Community Reports</h4>
        {reports.length === 0 ? (
          <p className="no-reports">No reports yet in this area.</p>
        ) : reports.slice(0, 5).map(report => (
          <div key={report.id} className="report-item">
            <div className={`report-badge type-${report.type}`}>{report.type}</div>
            <p>{report.description}</p>
            <span className="report-time">
              {new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CommunityPanel
