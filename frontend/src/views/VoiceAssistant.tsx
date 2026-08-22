import { useState, useEffect, useRef } from 'react'
import { useApp } from '../App'
import { LANG_LABELS } from '../translations'

type VoiceState = 'idle' | 'listening' | 'processing' | 'responding'

const EXAMPLE_QA: Record<string, { q: string; a: string }> = {
  en: {
    q: '"What should I do today?"',
    a: "Based on your latest soil report and current weather, consider delaying irrigation — rain is expected tomorrow morning. Also review your nitrogen management plan this week.",
  },
  te: {
    q: '"ఈరోజు నేను ఏమి చేయాలి?"',
    a: "మీ తాజా మట్టి నివేదిక మరియు వాతావరణ పరిస్థితుల ఆధారంగా, నీటిపారుదల ఆలస్యం చేయండి. రేపు వర్షం పడే అవకాశం ఉంది. ఈ వారం మీ నత్రజని యాజమాన్య ప్రణాళికను కూడా సమీక్షించండి.",
  },
  ta: {
    q: '"இன்று நான் என்ன செய்ய வேண்டும்?"',
    a: "உங்கள் சமீபத்திய மண் அறிக்கை மற்றும் வானிலை நிலைமைகளின் அடிப்படையில், நீர்ப்பாசனத்தை தாமதப்படுத்துங்கள். நாளை மழை எதிர்பார்க்கப்படுகிறது. இந்த வாரம் நைட்ரஜன் மேலாண்மை திட்டத்தை மதிப்பாய்வு செய்யுங்கள்.",
  },
  hi: {
    q: '"आज मुझे क्या करना चाहिए?"',
    a: "आपकी नवीनतम मिट्टी रिपोर्ट और मौसम के आधार पर, सिंचाई में देरी करें — कल सुबह बारिश की संभावना है। इस सप्ताह अपनी नाइट्रोजन प्रबंधन योजना की भी समीक्षा करें।",
  },
}

const HISTORY = [
  { role: 'user', text: '"Show my soil report"', lang: 'en' },
  { role: 'assistant', text: 'Opening your latest soil analysis from August 12, 2026. Soil Health Score: 72/100. Main issues: Low nitrogen and alkaline pH.', lang: 'en' },
]

export function VoiceAssistant() {
  const { t, lang, setLang } = useApp()
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [showResponse, setShowResponse] = useState(false)
  const [history, setHistory] = useState(HISTORY)
  const [transcript, setTranscript] = useState('')
  const responsePanelRef = useRef<HTMLDivElement>(null)

  const qa = EXAMPLE_QA[lang] || EXAMPLE_QA['en']

  // Web Speech API Text-to-Speech synthesizer
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel() // Stop any playing speech
      const utterance = new SpeechSynthesisUtterance(text)
      const speechLangMap: Record<string, string> = {
        en: 'en-IN',
        te: 'te-IN',
        ta: 'ta-IN',
        hi: 'hi-IN',
      }
      utterance.lang = speechLangMap[lang] || 'en-IN'
      window.speechSynthesis.speak(utterance)
    }
  }

  const handleMicPress = () => {
    if (voiceState !== 'idle') return

    // Mappings for speech recognition locales
    const speechLangMap: Record<string, string> = {
      en: 'en-IN',
      te: 'te-IN',
      ta: 'ta-IN',
      hi: 'hi-IN',
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition()
        recognition.lang = speechLangMap[lang] || 'en-IN'
        recognition.interimResults = false
        recognition.maxAlternatives = 1

        setVoiceState('listening')

        recognition.onresult = (event: any) => {
          const spokenText = event.results[0][0].transcript
          setTranscript(spokenText)
          setVoiceState('processing')
          
          setTimeout(() => {
            setVoiceState('responding')
            setShowResponse(true)
            speakText(qa.a)
            setHistory((h) => [
              ...h,
              { role: 'user', text: `"${spokenText}"`, lang },
              { role: 'assistant', text: qa.a, lang },
            ])
            setTimeout(() => setVoiceState('idle'), 3000)
          }, 1500)
        }

        recognition.onerror = () => {
          // Fallback simulation if mic is unavailable or blocked
          setVoiceState('processing')
          setTimeout(() => {
            setVoiceState('responding')
            setShowResponse(true)
            speakText(qa.a)
            setHistory((h) => [
              ...h,
              { role: 'user', text: qa.q, lang },
              { role: 'assistant', text: qa.a, lang },
            ])
            setTimeout(() => setVoiceState('idle'), 3000)
          }, 1500)
        }

        recognition.start()
        return
      } catch (err) {
        console.warn('SpeechRecognition failed to start, using simulation:', err)
      }
    }

    // Fallback timer simulation
    setVoiceState('listening')
    setTimeout(() => setVoiceState('processing'), 2500)
    setTimeout(() => {
      setVoiceState('responding')
      setShowResponse(true)
      speakText(qa.a)
      setHistory((h) => [
        ...h,
        { role: 'user', text: qa.q, lang },
        { role: 'assistant', text: qa.a, lang },
      ])
    }, 4000)
    setTimeout(() => setVoiceState('idle'), 5500)
  }

  const MIC_STYLES: Record<VoiceState, string> = {
    idle: 'bg-forest text-cream hover:bg-leaf shadow-lg cursor-pointer',
    listening: 'bg-risk text-cream shadow-xl scale-105',
    processing: 'bg-harvest text-cream shadow-lg',
    responding: 'bg-meadow text-cream shadow-md',
  }

  return (
    <div className="min-h-full flex flex-col p-6 max-w-2xl mx-auto gap-8">
      {/* Header */}
      <div className="text-center pt-4">
        <h1 className="font-display text-3xl text-charcoal">{t('voice_title')}</h1>
        <p className="text-sage text-sm mt-2">{t('voice_sub')}</p>
      </div>

      {/* Language selector */}
      <div className="flex justify-center">
        <div className="flex items-center border border-pebble rounded-xl overflow-hidden">
          {(Object.keys(LANG_LABELS) as (keyof typeof LANG_LABELS)[]).map((code) => (
            <button
              key={code}
              onClick={() => setLang(code)}
              className={`px-4 py-2 text-sm transition-colors ${
                lang === code ? 'bg-forest text-cream font-medium' : 'text-sage hover:text-charcoal hover:bg-mist'
              }`}
            >
              {LANG_LABELS[code]}
            </button>
          ))}
        </div>
      </div>

      {/* Central mic area */}
      <div className="flex flex-col items-center gap-6 py-6">
        {/* Pulse rings */}
        <div className="relative flex items-center justify-center w-40 h-40">
          {voiceState === 'listening' && (
            <>
              <div className="absolute w-40 h-40 rounded-full bg-risk/15 pulse-ring" />
              <div className="absolute w-32 h-32 rounded-full bg-risk/20 pulse-ring" style={{ animationDelay: '0.4s' }} />
            </>
          )}
          <button
            onClick={handleMicPress}
            disabled={voiceState !== 'idle'}
            className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${MIC_STYLES[voiceState]}`}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="22"/>
            </svg>
          </button>
        </div>

        {/* State label */}
        <div className="text-center h-8">
          {voiceState === 'idle' && (
            <p className="text-sage text-sm">{t('voice_idle')}</p>
          )}
          {voiceState === 'listening' && (
            <div className="flex items-center gap-3">
              {/* Waveform */}
              {[1,2,3,4,5,6,7].map((_, i) => (
                <span
                  key={i}
                  className="wave-bar inline-block w-1.5 rounded-full bg-risk"
                  style={{
                    height: `${12 + (i % 3) * 8}px`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
              <span className="text-risk font-medium text-sm ml-1">{t('voice_listening')}</span>
            </div>
          )}
          {voiceState === 'processing' && (
            <p className="text-harvest font-medium text-sm">{t('voice_processing')}</p>
          )}
          {voiceState === 'responding' && (
            <p className="text-meadow font-medium text-sm">Playing response...</p>
          )}
        </div>
      </div>

      {/* Response area */}
      {showResponse && (
        <div className="space-y-3 step-in" ref={responsePanelRef}>
          {/* User query */}
          <div className="bg-forest/8 border border-forest/20 rounded-xl p-4">
            <div className="text-xs font-mono uppercase tracking-widest text-forest mb-2">{t('voice_you_said')}</div>
            <p className="text-charcoal font-medium text-base">{qa.q}</p>
          </div>

          {/* Assistant response */}
          <div className="bg-white border border-pebble rounded-xl p-4">
            <div className="text-xs font-mono uppercase tracking-widest text-sage mb-2">{t('voice_responding')}</div>
            <p className="text-charcoal text-sm leading-relaxed">{qa.a}</p>
            <div className="flex items-center gap-3 mt-4">
              <button className="flex items-center gap-1.5 text-xs text-leaf border border-leaf/30 rounded-lg px-3 py-1.5 hover:bg-leaf/8 transition-colors">
                🔊 {t('voice_listen')}
              </button>
              <button
                onClick={() => { setShowResponse(false); setVoiceState('idle') }}
                className="flex items-center gap-1.5 text-xs text-sage border border-pebble rounded-lg px-3 py-1.5 hover:bg-mist transition-colors"
              >
                ↻ {t('voice_again')}
              </button>
              <button className="flex items-center gap-1.5 text-xs text-rain border border-rain/30 rounded-lg px-3 py-1.5 hover:bg-rain/8 transition-colors">
                📋 {t('voice_details')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conversation history */}
      {history.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-mono uppercase tracking-widest text-sage">Conversation</div>
          {history.slice(-4).map((msg, i) => (
            <div
              key={i}
              className={`rounded-xl p-3 text-sm ${
                msg.role === 'user'
                  ? 'bg-mist text-charcoal ml-8'
                  : 'bg-white border border-pebble text-charcoal/80 mr-8'
              }`}
            >
              <span className="text-xs text-sage font-mono mr-2">
                {msg.role === 'user' ? 'You' : 'FarmAssist'}:
              </span>
              {msg.text}
            </div>
          ))}
        </div>
      )}

      {/* Example prompts */}
      <div className="space-y-2">
        <div className="text-xs font-mono uppercase tracking-widest text-sage">Try asking</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { en: '"Open soil report"', te: '"మట్టి నివేదిక తెరవండి"' },
            { en: '"Show today\'s weather"', te: '"ఈరోజు వాతావరణం చూపించు"' },
            { en: '"Read my advisory"', te: '"నా సూచన చదివి వినిపించు"' },
            { en: '"Show alerts"', te: '"హెచ్చరికలు చూపించు"' },
          ].map((prompt) => (
            <button
              key={prompt.en}
              onClick={handleMicPress}
              className="text-left text-xs text-sage border border-pebble rounded-lg px-3 py-2 hover:bg-mist hover:text-charcoal transition-colors"
            >
              <div>{lang === 'te' ? prompt.te : prompt.en}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
