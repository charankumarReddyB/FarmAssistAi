import { useState, useEffect, useRef } from 'react'
import { useApp } from '../App'
import { AiBadge, StatusBadge } from '../components/StatusBadge'
import { getApiBaseUrl, getAuthHeaders } from '../lib/api'

type CropState = 'upload' | 'processing' | 'results'

const GUIDANCE = [
  { icon: '💡', key: 'crop_guidance_light' },
  { icon: '🎯', key: 'crop_guidance_focus' },
  { icon: '🌿', key: 'crop_guidance_leaf' },
  { icon: '📷', key: 'crop_guidance_blur' },
]

const PROCESSING_STEP_KEYS = [
  'crop_processing_1',
  'crop_processing_2',
  'crop_processing_3',
  'crop_processing_4',
  'crop_processing_5',
]

export function CropAnalysis() {
  const { t, lang, setView } = useApp()
  const [state, setState] = useState<CropState>('upload')
  const [processingStep, setProcessingStep] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // API Analysis result state
  const [analysisResult, setAnalysisResult] = useState<any>(null)

  useEffect(() => {
    if (state !== 'processing') return
    setProcessingStep(0)
    const interval = setInterval(() => {
      setProcessingStep((s) => {
        if (s >= PROCESSING_STEP_KEYS.length - 1) {
          clearInterval(interval)
          return s
        }
        return s + 1
      })
    }, 750)
    return () => clearInterval(interval)
  }, [state])

  const handleFileChange = (file: File) => {
    setErrorMsg(null)
    const ext = file.name.split('.').pop()?.toLowerCase()
    const allowed = ['jpg', 'jpeg', 'png', 'webp']
    if (!ext || !allowed.includes(ext)) {
      setErrorMsg(`Unsupported format '.${ext}'. Allowed: JPG, JPEG, PNG, WEBP.`)
      return
    }
    if (file.size === 0) {
      setErrorMsg('Selected image file is empty (0 bytes).')
      return
    }
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const startAnalysis = async () => {
    if (!selectedFile) return
    setState('processing')
    setErrorMsg(null)

    try {
      // Step 1: Upload to POST /api/crop-analysis/upload
      const formData = new FormData()
      formData.append('file', selectedFile)

      const baseUrl = getApiBaseUrl()
      const authHeaders = getAuthHeaders()

      const uploadResp = await fetch(`${baseUrl}/crop-analysis/upload`, {
        method: 'POST',
        headers: {
          ...authHeaders,
        },
        body: formData,
      })

      if (!uploadResp.ok) {
        const errJson = await uploadResp.json().catch(() => ({}))
        throw new Error(errJson.detail || 'Crop image upload failed.')
      }

      const uploadData = await uploadResp.json()
      const imageId = uploadData.image_id

      // Step 2: Trigger PyTorch MobileNetV2 Analysis
      const analyzeResp = await fetch(`${baseUrl}/crop-analysis/analyze/${imageId}?language=${lang}`, {
        method: 'POST',
        headers: {
          ...authHeaders,
        },
      })

      if (!analyzeResp.ok) {
        const errJson = await analyzeResp.json().catch(() => ({}))
        throw new Error(errJson.detail || 'Crop image analysis failed.')
      }

      const result = await analyzeResp.json()
      setAnalysisResult(result)

      setTimeout(() => {
        setState('results')
      }, 1000)

    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Error executing MobileNetV2 image analysis.')
      setState('upload')
    }
  }

  const handleSampleImage = () => {
    // Generate canvas sample leaf image
    const canvas = document.createElement('canvas')
    canvas.width = 300
    canvas.height = 300
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#2d6a4f'
      ctx.fillRect(0, 0, 300, 300)
      ctx.fillStyle = '#a33320'
      ctx.beginPath()
      ctx.arc(150, 150, 50, 0, 2 * Math.PI)
      ctx.fill()
    }
    canvas.toBlob((blob) => {
      if (blob) {
        const sampleFile = new File([blob], 'paddy_blast_sample.jpg', { type: 'image/jpeg' })
        handleFileChange(sampleFile)
      }
    }, 'image/jpeg')
  }

  if (state === 'processing') {
    return (
      <div className="min-h-full flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-pebble" />
            <div className="absolute inset-0 rounded-full border-4 border-t-leaf border-l-transparent border-r-transparent border-b-transparent spin-slow" />
            <div className="absolute inset-2 rounded-full bg-cream flex items-center justify-center">
              <span className="text-leaf text-2xl">⬢</span>
            </div>
          </div>
          <div className="space-y-3">
            {PROCESSING_STEP_KEYS.map((stepKey, i) => (
              <div
                key={stepKey}
                className={`flex items-center gap-3 transition-all duration-300 text-left ${
                  i < processingStep ? 'opacity-40' : i === processingStep ? 'opacity-100' : 'opacity-20'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
                  i < processingStep ? 'bg-meadow text-cream' : i === processingStep ? 'bg-leaf text-cream' : 'bg-pebble text-sage'
                }`}>
                  {i < processingStep ? '✓' : i + 1}
                </div>
                <span className={`text-sm ${i === processingStep ? 'text-charcoal font-semibold' : 'text-sage'}`}>
                  {t(stepKey)}
                </span>
              </div>
            ))}
          </div>
          <p className="text-sage text-xs">{t('crop_processing_3')}</p>
        </div>
      </div>
    )
  }

  if (state === 'results') {
    const confPct = Math.round((analysisResult?.confidence_score || 0.92) * 100)
    const riskLvl = analysisResult?.risk_level || 'MODERATE'
    const diseaseName = analysisResult?.disease_name || 'Paddy Blast & Brown Spot'
    const cropType = analysisResult?.crop_type || 'Paddy / Rice'
    const symptomsList = analysisResult?.symptoms || ['Spindle-shaped lesions on leaf margins.']
    const recsList = analysisResult?.management_recommendations || ['Apply Tricyclazole 75% WP @ 0.6 g/L.']

    return (
      <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <button
              onClick={() => setState('upload')}
              className="text-xs text-sage hover:text-charcoal transition-colors mb-2 flex items-center gap-1"
            >
              ← {t('back')}
            </button>
            <h1 className="font-display text-3xl text-charcoal">{t('crop_title')}</h1>
            <p className="text-sage text-sm mt-1">
              PyTorch Model Diagnosis · {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <AiBadge label="MobileNetV2 Deep Learning" />
            <button
              onClick={() => setState('upload')}
              className="px-3 py-1.5 text-xs border border-pebble rounded-lg text-sage hover:text-charcoal transition-all"
            >
              {t('new_analysis')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Image panel */}
          <div className="lg:col-span-2">
            <div className="bg-charcoal rounded-xl overflow-hidden aspect-square relative shadow-sm border border-pebble">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Crop Leaf Upload"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-cream/40 text-4xl">🌾</div>
              )}
              <div className="absolute top-3 left-3 bg-risk text-cream text-xs font-mono px-2 py-1 rounded-md">
                ● Model Probability: {confPct}%
              </div>
              <div className="absolute bottom-3 left-3 right-3 bg-charcoal/80 backdrop-blur-sm rounded-lg px-3 py-2">
                <div className="text-cream/60 text-xs">Diagnosed Leaf Image</div>
                <div className="text-cream text-sm font-medium truncate">{selectedFile?.name || 'crop_leaf.jpg'}</div>
              </div>
            </div>
          </div>

          {/* Analysis panel */}
          <div className="lg:col-span-3 space-y-4">
            {/* Diagnosis card */}
            <div className="bg-white border border-pebble rounded-xl p-5">
              <div className="text-xs font-mono uppercase tracking-widest text-sage mb-4">Predicted Crop Disease</div>

              <div className="flex items-start gap-4 mb-4">
                <span className="text-4xl">🌿</span>
                <div>
                  <h2 className="font-display text-2xl text-charcoal">{cropType}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge
                      level={riskLvl === 'CRITICAL' || riskLvl === 'HIGH' ? 'warning' : 'info'}
                      label={diseaseName}
                    />
                  </div>
                  <p className="text-sage text-xs mt-1 font-mono">MobileNetV2 Classification Model</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-mist rounded-lg p-3 text-center">
                  <div className="text-xs text-sage font-mono uppercase tracking-wide mb-1">Model Confidence</div>
                  <div className="font-display text-xl text-charcoal">{confPct}%</div>
                </div>
                <div className="bg-mist rounded-lg p-3 text-center">
                  <div className="text-xs text-sage font-mono uppercase tracking-wide mb-1">Risk Level</div>
                  <div className={`font-display text-xl ${riskLvl === 'CRITICAL' ? 'text-risk' : riskLvl === 'HIGH' ? 'text-harvest' : 'text-meadow'}`}>
                    {riskLvl}
                  </div>
                </div>
                <div className="bg-mist rounded-lg p-3 text-center">
                  <div className="text-xs text-sage font-mono uppercase tracking-wide mb-1">Diagnosis Status</div>
                  <div className="font-display text-base text-charcoal truncate">{analysisResult?.disease_status || 'Analyzed'}</div>
                </div>
              </div>
            </div>

            {/* Symptoms & Action */}
            <div className="bg-white border border-pebble rounded-xl p-5">
              <h3 className="font-display text-lg text-charcoal mb-3">Management & Chemical Treatment</h3>
              <div className="space-y-2.5">
                {recsList.map((action: string, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-forest/10 text-forest text-xs font-mono font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-charcoal/80 text-sm leading-relaxed">{action}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Weather Risk Context */}
            <div className="bg-harvest/8 border border-harvest/20 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-harvest mb-1">🌦 Weather-Based Disease Risk Assessment</h3>
              <p className="text-charcoal/80 text-xs leading-relaxed">
                {analysisResult?.weather_impact}
              </p>
            </div>
          </div>
        </div>

        {/* Multilingual Advisory */}
        <div className="bg-cream border border-pebble rounded-xl p-5 flex items-center justify-between">
          <div>
            <div className="font-medium text-charcoal">Farmer Advisory ({lang.toUpperCase()})</div>
            <div className="text-sage text-sm mt-1 leading-relaxed max-w-3xl">
              {analysisResult?.final_advisory}
            </div>
          </div>
          <button
            onClick={() => setView('advisory')}
            className="px-5 py-2.5 bg-forest text-cream rounded-lg text-sm font-medium hover:bg-leaf transition-colors flex-shrink-0 ml-4"
          >
            {t('qa_advisory')} →
          </button>
        </div>
      </div>
    )
  }

  // Upload state UI
  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="font-display text-3xl text-charcoal">{t('crop_title')}</h1>
        <p className="text-sage text-sm mt-2 leading-relaxed">{t('crop_sub')}</p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-risk/10 border border-risk/30 rounded-xl text-risk text-sm font-medium">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileChange(e.target.files[0])
          }
        }}
      />

      {/* Upload button options */}
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center gap-3 py-8 rounded-2xl border-2 transition-all cursor-pointer ${
            selectedFile ? 'border-leaf bg-leaf/5 text-forest' : 'border-pebble bg-white text-sage hover:border-leaf/50 hover:text-charcoal'
          }`}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          <div>
            <div className="font-medium text-sm">Select Crop Leaf Image</div>
            <div className="text-xs opacity-70 mt-0.5">JPG, JPEG, PNG, WEBP</div>
          </div>
        </button>

        <button
          type="button"
          onClick={handleSampleImage}
          className="flex flex-col items-center gap-3 py-8 rounded-2xl border-2 border-pebble bg-white text-sage hover:border-leaf/50 hover:text-charcoal transition-all cursor-pointer"
        >
          <span className="text-3xl">🌾</span>
          <div>
            <div className="font-medium text-sm">Load Paddy Blast Sample</div>
            <div className="text-xs opacity-70 mt-0.5">Sample Leaf Test Image</div>
          </div>
        </button>
      </div>

      {/* Image Preview & Drop area */}
      {previewUrl ? (
        <div className="bg-white border-2 border-forest rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={previewUrl} alt="Leaf Preview" className="w-16 h-16 rounded-xl object-cover border border-pebble" />
            <div>
              <div className="text-charcoal font-semibold text-sm">{selectedFile?.name}</div>
              <div className="text-sage text-xs">{(selectedFile!.size / 1024).toFixed(1)} KB · Ready for MobileNetV2 Analysis</div>
            </div>
          </div>
          <button
            onClick={() => { setSelectedFile(null); setPreviewUrl(null) }}
            className="text-xs text-risk hover:underline px-2 py-1"
          >
            Remove
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="rounded-2xl border-2 border-dashed border-pebble bg-white p-10 flex flex-col items-center justify-center text-center gap-2 cursor-pointer hover:border-leaf/50 transition-all"
        >
          <div className="text-3xl">📷</div>
          <div className="text-charcoal font-medium text-sm">Click to browse or drop crop leaf photo here</div>
          <div className="text-sage text-xs">Maximum file size: 20MB</div>
        </div>
      )}

      {/* Guidance list */}
      <div className="bg-mist rounded-xl p-4">
        <div className="text-xs font-mono uppercase tracking-widest text-sage mb-3">Photo Quality Guidelines</div>
        <div className="grid grid-cols-2 gap-3">
          {GUIDANCE.map((g) => (
            <div key={g.key} className="flex items-center gap-2 text-xs text-charcoal/80">
              <span>{g.icon}</span>
              <span>{t(g.key)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Submit CTA */}
      <button
        onClick={startAnalysis}
        disabled={!selectedFile}
        className={`w-full py-4 rounded-xl font-medium text-base transition-all ${
          selectedFile
            ? 'bg-forest text-cream hover:bg-leaf shadow-sm cursor-pointer'
            : 'bg-mist text-sage cursor-not-allowed'
        }`}
      >
        {t('crop_analyze')}
      </button>
    </div>
  )
}
