import { useState, useEffect } from 'react'
import { useApp } from '../App'
import { Logo } from '../components/Logo'
import { RiskBadge, AiBadge, StatusBadge } from '../components/StatusBadge'

type ExpertView = 'dashboard' | 'review'

interface AdvisoryData {
  advisory_id: str
  report_id?: string
  crop_analysis_id?: string
  farmer_id?: string
  farmer_name?: string
  farmer_location?: string
  source_type: string
  report_summary: string
  soil_health_analysis: string
  crop_disease_info?: string
  extracted_data?: {
    ph?: number
    nitrogen?: number
    phosphorus?: number
    potassium?: number
    organic_carbon?: number
    electrical_conductivity?: number
  }
  crop_recommendations: string[]
  fertilizer_recommendations: string[]
  irrigation_suggestions: string[]
  pest_disease_alerts: string[]
  nutrient_deficiencies: string[]
  risk_analysis: string[]
  risk_level: string
  weather_impact?: string
  original_ai_advisory: string
  final_advisory: string
  status: string
  reviewed_by?: string
  expert_id?: string
  expert_notes?: string
  created_at?: string
  reviewed_at?: string
}

export function ExpertPortal() {
  const { setView } = useApp()
  const [expertView, setExpertView] = useState<ExpertView>('dashboard')
  const [advisories, setAdvisories] = useState<AdvisoryData[]>([])
  const [selectedCase, setSelectedCase] = useState<AdvisoryData | null>(null)

  // Action input states
  const [editedAdvisory, setEditedAdvisory] = useState('')
  const [expertNotes, setExpertNotes] = useState('')
  const [expertName, setExpertName] = useState('Dr. M. S. Swaminathan (Agri Specialist)')
  const [loadingAction, setLoadingAction] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const fetchAdvisories = async () => {
    try {
      const resp = await fetch('http://127.0.0.1:8000/api/expert/advisories')
      if (resp.ok) {
        const data = await resp.json()
        setAdvisories(data)
      }
    } catch (err) {
      console.error('Failed to fetch expert advisories:', err)
    }
  }

  useEffect(() => {
    fetchAdvisories()
  }, [])

  const handleSelectCase = (adv: AdvisoryData) => {
    setSelectedCase(adv)
    setEditedAdvisory(adv.final_advisory || adv.original_ai_advisory || '')
    setExpertNotes(adv.expert_notes || '')
    setErrorMsg(null)
    setExpertView('review')
  }

  const handleApprove = async () => {
    if (!selectedCase) return
    setLoadingAction(true)
    setErrorMsg(null)
    try {
      const resp = await fetch(`http://127.0.0.1:8000/api/expert/advisories/${selectedCase.advisory_id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expert_id: 'exp_101',
          expert_name: expertName,
          notes: expertNotes || 'Verified and approved for farmer implementation.',
        }),
      })
      if (!resp.ok) {
        throw new Error('Approval submission failed.')
      }
      await fetchAdvisories()
      setExpertView('dashboard')
      setSelectedCase(null)
    } catch (err: any) {
      setErrorMsg(err.message || 'Error approving advisory.')
    } finally {
      setLoadingAction(false)
    }
  }

  const handleModify = async () => {
    if (!selectedCase) return
    if (!editedAdvisory.trim()) {
      setErrorMsg('Please enter modified advisory recommendations.')
      return
    }
    setLoadingAction(true)
    setErrorMsg(null)
    try {
      const resp = await fetch(`http://127.0.0.1:8000/api/expert/advisories/${selectedCase.advisory_id}/modify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expert_id: 'exp_101',
          expert_name: expertName,
          modified_advisory: editedAdvisory,
          expert_notes: expertNotes || 'Updated specific dosage and application timing.',
        }),
      })
      if (!resp.ok) {
        throw new Error('Modification submission failed.')
      }
      await fetchAdvisories()
      setExpertView('dashboard')
      setSelectedCase(null)
    } catch (err: any) {
      setErrorMsg(err.message || 'Error modifying advisory.')
    } finally {
      setLoadingAction(false)
    }
  }

  const handleReject = async () => {
    if (!selectedCase) return
    if (!expertNotes.trim()) {
      setErrorMsg('Please enter a rejection reason in expert notes.')
      return
    }
    setLoadingAction(true)
    setErrorMsg(null)
    try {
      const resp = await fetch(`http://127.0.0.1:8000/api/expert/advisories/${selectedCase.advisory_id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expert_id: 'exp_101',
          expert_name: expertName,
          rejection_reason: expertNotes,
        }),
      })
      if (!resp.ok) {
        throw new Error('Rejection submission failed.')
      }
      await fetchAdvisories()
      setExpertView('dashboard')
      setSelectedCase(null)
    } catch (err: any) {
      setErrorMsg(err.message || 'Error rejecting advisory.')
    } finally {
      setLoadingAction(false)
    }
  }

  const pendingCount = advisories.filter((a) => a.status === 'pending_review' || a.status === 'generated' || a.status === 'under_review').length
  const highRiskCount = advisories.filter((a) => a.risk_level === 'HIGH' || a.risk_level === 'CRITICAL').length
  const approvedCount = advisories.filter((a) => a.status === 'approved' || a.status === 'modified').length

  if (expertView === 'review' && selectedCase) {
    return (
      <div className="min-h-screen bg-[#12201a] text-cream flex flex-col font-sans">
        {/* Expert top bar */}
        <header className="flex items-center gap-4 px-6 py-4 border-b border-white/10">
          <button
            onClick={() => { setExpertView('dashboard'); setSelectedCase(null) }}
            className="text-cream/60 hover:text-cream text-sm transition-colors flex items-center gap-1 cursor-pointer"
          >
            ← Back to Dashboard
          </button>
          <div className="h-4 w-px bg-white/15" />
          <Logo variant="light" size={24} />
          <span className="text-cream/40 text-xs font-mono">AGRICULTURAL EXPERT REVIEW PORTAL</span>
          <div className="ml-auto flex items-center gap-2">
            <RiskBadge level={selectedCase.risk_level as any} />
            <span className="text-cream/60 text-xs font-mono uppercase">
              {selectedCase.source_type.replace('_', ' ')} · ID: {selectedCase.advisory_id.slice(0, 8)}
            </span>
          </div>
        </header>

        {errorMsg && (
          <div className="bg-risk/20 border border-risk/40 text-cream text-sm px-6 py-3 font-medium">
            ⚠️ {errorMsg}
          </div>
        )}

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-0">
          {/* Left — farmer + AI data */}
          <div className="lg:col-span-3 p-6 space-y-5 border-r border-white/8">
            {/* Farmer */}
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-xs font-mono uppercase tracking-widest text-cream/40 mb-3">Farmer Information</div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-leaf text-cream font-medium flex items-center justify-center">
                  {(selectedCase.farmer_name || 'R')[0]}
                </div>
                <div>
                  <div className="font-medium text-cream text-base">{selectedCase.farmer_name || 'Raju Reddy'}</div>
                  <div className="text-cream/50 text-xs">{selectedCase.farmer_location} · ID: {selectedCase.farmer_id}</div>
                </div>
              </div>
            </div>

            {/* Analysis details */}
            <div className="bg-white/5 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-mono uppercase tracking-widest text-cream/40">Technical Analysis Data</div>
                <AiBadge label={selectedCase.source_type.replace('_', ' ').toUpperCase()} />
              </div>

              {selectedCase.extracted_data && (
                <div className="grid grid-cols-4 gap-2 pt-2">
                  <div className="bg-white/5 p-2.5 rounded-lg text-center">
                    <div className="text-[10px] text-cream/50 uppercase font-mono">Soil pH</div>
                    <div className="font-mono text-sm text-cream font-semibold">{selectedCase.extracted_data.ph ?? 'N/A'}</div>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-lg text-center">
                    <div className="text-[10px] text-cream/50 uppercase font-mono">Nitrogen (N)</div>
                    <div className="font-mono text-sm text-cream font-semibold">{selectedCase.extracted_data.nitrogen ? `${selectedCase.extracted_data.nitrogen} kg/ha` : 'N/A'}</div>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-lg text-center">
                    <div className="text-[10px] text-cream/50 uppercase font-mono">Phosphorus (P)</div>
                    <div className="font-mono text-sm text-cream font-semibold">{selectedCase.extracted_data.phosphorus ? `${selectedCase.extracted_data.phosphorus} kg/ha` : 'N/A'}</div>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-lg text-center">
                    <div className="text-[10px] text-cream/50 uppercase font-mono">Potassium (K)</div>
                    <div className="font-mono text-sm text-cream font-semibold">{selectedCase.extracted_data.potassium ? `${selectedCase.extracted_data.potassium} kg/ha` : 'N/A'}</div>
                  </div>
                </div>
              )}

              {selectedCase.crop_disease_info && (
                <div className="bg-white/5 p-3 rounded-lg">
                  <div className="text-xs font-mono uppercase text-cream/50 mb-1">Crop Disease Diagnosis</div>
                  <div className="text-sm font-semibold text-harvest">{selectedCase.crop_disease_info}</div>
                </div>
              )}

              {selectedCase.soil_health_analysis && (
                <div>
                  <div className="text-xs font-mono uppercase text-cream/40 mb-1">Soil Health Observations</div>
                  <p className="text-cream/80 text-xs leading-relaxed">{selectedCase.soil_health_analysis}</p>
                </div>
              )}

              {selectedCase.weather_impact && (
                <div>
                  <div className="text-xs font-mono uppercase text-cream/40 mb-1">Live Weather Disease Context</div>
                  <p className="text-cream/80 text-xs leading-relaxed">{selectedCase.weather_impact}</p>
                </div>
              )}
            </div>

            {/* Original AI Advisory */}
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-xs font-mono uppercase tracking-widest text-cream/40 mb-2">Original AI Advisory Output</div>
              <p className="text-cream/90 text-sm leading-relaxed font-sans">{selectedCase.original_ai_advisory}</p>
            </div>
          </div>

          {/* Right — Expert actions & Verification */}
          <div className="lg:col-span-2 p-6 space-y-5 bg-[#0e1914] flex flex-col justify-between">
            <div className="space-y-4">
              <div className="text-xs font-mono uppercase tracking-widest text-cream/40">Expert Validation & Modification</div>

              <div>
                <label className="text-xs text-cream/60 block mb-1 font-mono">Expert Name & Title</label>
                <input
                  type="text"
                  value={expertName}
                  onChange={(e) => setExpertName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-cream focus:outline-none focus:border-leaf"
                />
              </div>

              <div>
                <label className="text-xs text-cream/60 block mb-1 font-mono">Final Verified Advisory (Editable)</label>
                <textarea
                  rows={6}
                  value={editedAdvisory}
                  onChange={(e) => setEditedAdvisory(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-cream focus:outline-none focus:border-leaf leading-relaxed"
                  placeholder="Enter or edit final verified recommendations for the farmer..."
                />
              </div>

              <div>
                <label className="text-xs text-cream/60 block mb-1 font-mono">Expert Notes / Rejection Reason</label>
                <textarea
                  rows={3}
                  value={expertNotes}
                  onChange={(e) => setExpertNotes(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-xs text-cream focus:outline-none focus:border-leaf"
                  placeholder="Add internal notes, justification, or rejection reason..."
                />
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-white/10">
              <button
                onClick={handleApprove}
                disabled={loadingAction}
                className="w-full py-3 bg-meadow text-cream rounded-xl text-sm font-semibold hover:bg-leaf transition-all shadow-sm cursor-pointer"
              >
                {loadingAction ? 'Submitting...' : '✓ APPROVE ADVISORY'}
              </button>

              <button
                onClick={handleModify}
                disabled={loadingAction}
                className="w-full py-3 bg-harvest text-cream rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-sm cursor-pointer"
              >
                ✏️ SUBMIT MODIFIED ADVISORY
              </button>

              <button
                onClick={handleReject}
                disabled={loadingAction}
                className="w-full py-2.5 border border-risk/40 text-risk rounded-xl text-xs font-semibold hover:bg-risk/10 transition-all cursor-pointer"
              >
                ✕ REJECT ADVISORY
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Dashboard view
  return (
    <div className="min-h-screen bg-[#12201a] text-cream flex flex-col font-sans">
      {/* Top Bar */}
      <header className="flex items-center gap-4 px-6 py-4 border-b border-white/10">
        <Logo variant="light" size={26} />
        <div className="h-4 w-px bg-white/15" />
        <span className="text-cream/40 text-xs font-mono uppercase">AGRICULTURAL EXPERT DASHBOARD</span>
        <button
          onClick={() => setView('dashboard')}
          className="ml-auto text-xs text-cream/60 hover:text-cream border border-white/15 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
        >
          ← Exit to Farmer App
        </button>
      </header>

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl text-harvest">⏳</span>
            <div>
              <div className="text-2xl font-bold text-cream font-mono">{pendingCount}</div>
              <div className="text-xs text-cream/50 uppercase font-mono">Pending Expert Review</div>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl text-risk">◉</span>
            <div>
              <div className="text-2xl font-bold text-cream font-mono">{highRiskCount}</div>
              <div className="text-xs text-cream/50 uppercase font-mono">High Risk Cases</div>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl text-meadow">✓</span>
            <div>
              <div className="text-2xl font-bold text-cream font-mono">{approvedCount}</div>
              <div className="text-xs text-cream/50 uppercase font-mono">Verified Advisories</div>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl text-rain">◈</span>
            <div>
              <div className="text-2xl font-bold text-cream font-mono">100%</div>
              <div className="text-xs text-cream/50 uppercase font-mono">Database Persistence</div>
            </div>
          </div>
        </div>

        {/* Advisory queue list */}
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="font-semibold text-cream text-lg">Farmer Advisories Queue</h2>
            <button
              onClick={fetchAdvisories}
              className="text-xs text-cream/60 hover:text-cream font-mono flex items-center gap-1 cursor-pointer"
            >
              🔄 Refresh List
            </button>
          </div>

          <div className="divide-y divide-white/5">
            {advisories.length === 0 ? (
              <div className="p-8 text-center text-cream/40 text-sm">
                No advisories found in queue. Generate a Soil or Crop report to trigger expert review.
              </div>
            ) : (
              advisories.map((adv) => (
                <div
                  key={adv.advisory_id}
                  onClick={() => handleSelectCase(adv)}
                  className="p-5 hover:bg-white/5 transition-all flex items-center justify-between cursor-pointer group"
                >
                  <div className="space-y-1.5 max-w-3xl">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-cream text-base">{adv.farmer_name || 'Raju Reddy'}</span>
                      <span className="text-xs text-cream/50 font-mono">({adv.farmer_location})</span>
                      <span className="text-[10px] font-mono uppercase bg-white/10 px-2 py-0.5 rounded text-cream/70">
                        {adv.source_type.replace('_', ' ')}
                      </span>
                      <StatusBadge level={adv.status === 'approved' ? 'success' : adv.status === 'modified' ? 'info' : adv.status === 'rejected' ? 'error' : 'warning'} label={adv.status.replace('_', ' ').toUpperCase()} />
                    </div>

                    <p className="text-cream/80 text-sm line-clamp-1 leading-relaxed">
                      {adv.final_advisory || adv.original_ai_advisory || adv.report_summary}
                    </p>

                    <div className="text-xs text-cream/40 font-mono">
                      Created: {adv.created_at ? new Date(adv.created_at).toLocaleString() : 'Recent'} {adv.reviewed_by ? `· Reviewed by: ${adv.reviewed_by}` : ''}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <RiskBadge level={adv.risk_level as any} />
                    <span className="text-cream/40 group-hover:text-cream group-hover:translate-x-1 transition-all text-lg">→</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
