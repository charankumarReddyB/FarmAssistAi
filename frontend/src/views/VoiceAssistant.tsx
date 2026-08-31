import { useState, useRef } from 'react'
import { useApp } from '../App'
import { LANG_LABELS, type Lang } from '../translations'
import { apiRequest } from '../lib/api'

type VoiceState = 'idle' | 'listening' | 'processing' | 'responding'

interface MessageItem {
  role: 'user' | 'assistant'
  text: string
  lang: string
  action?: string
  actionTarget?: string
}

export function VoiceAssistant() {
  const { t, lang, setLang, setView, updateUser } = useApp()
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [history, setHistory] = useState<MessageItem[]>([
    {
      role: 'assistant',
      text: lang === 'te'
        ? 'నమస్కారం! నేను మీ FarmAssist AI అసిస్టెంట్‌ని. వాతావరణం, పంట ఆరోగ్యం, లేదా మట్టి విశ్లేషణ గురించి నన్ను అడగండి.'
        : lang === 'ta'
        ? 'வணக்கம்! நான் உங்கள் FarmAssist AI உதவியாளர். வானிலை, பயிர் ஆரோக்கியம் அல்லது மண் பரிசோதனை பற்றி என்னிடம் கேளுங்கள்.'
        : lang === 'hi'
        ? 'नमस्ते! मैं आपका FarmAssist AI सहायक हूँ। मौसम, फसल स्वास्थ्य या मिट्टी विश्लेषण के बारे में मुझसे पूछें।'
        : 'Hello! I am your FarmAssist AI Voice Assistant. Ask me about your farm weather, crop health, soil reports, or say "Open soil analysis".',
      lang,
    },
  ])
  const [currentResponse, setCurrentResponse] = useState<string | null>(null)
  const [lastQuery, setLastQuery] = useState<string | null>(null)
  const [textInput, setTextInput] = useState('')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const responsePanelRef = useRef<HTMLDivElement>(null)

  const speechLangMap: Record<Lang, string> = {
    en: 'en-IN',
    te: 'te-IN',
    ta: 'ta-IN',
    hi: 'hi-IN',
  }

  // Web Speech API Text-to-Speech synthesizer
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel() // Stop any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = speechLangMap[lang] || 'en-IN'
      utterance.rate = 0.95
      utterance.pitch = 1.0
      window.speechSynthesis.speak(utterance)
    }
  }

  // Central query processor calling backend AI assistant
  const processQuery = async (queryText: string) => {
    if (!queryText.trim()) return

    setLastQuery(queryText)
    setVoiceState('processing')
    setStatusMessage('Processing query with Agricultural AI...')

    try {
      const data = await apiRequest('/assistant/chat', {
        method: 'POST',
        body: JSON.stringify({
          query: queryText,
          language: lang,
        }),
      })

      const reply = data.response || 'I could not process your query. Please try again.'
      setCurrentResponse(reply)
      setVoiceState('responding')
      setStatusMessage(null)

      // Add to conversation history
      setHistory((prev) => [
        ...prev,
        { role: 'user', text: queryText, lang },
        {
          role: 'assistant',
          text: reply,
          lang,
          action: data.action,
          actionTarget: data.action_payload?.target,
        },
      ])

      // Play audio response
      speakText(reply)

      // Execute backend actions if instructed
      if (data.action === 'update_user' && data.action_payload) {
        updateUser(data.action_payload)
      } else if (data.action === 'navigate' && data.action_payload?.target) {
        setTimeout(() => {
          setView(data.action_payload.target)
        }, 2200)
      }

      setTimeout(() => {
        setVoiceState('idle')
      }, 3500)
    } catch (err: any) {
      console.error('[VOICE] Assistant query error:', err)
      const errorReply = lang === 'te'
        ? 'సర్వర్ కనెక్ట్ కాలేదు. దయచేసి మళ్లీ ప్రయత్నించండి.'
        : lang === 'hi'
        ? 'सर्वर से कनेक्ट करने में असमर्थ। कृपया पुनः प्रयास करें।'
        : lang === 'ta'
        ? 'சேவையகத்துடன் இணைக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.'
        : 'Unable to connect to the assistant server. Please check your connection and try again.'

      setCurrentResponse(errorReply)
      setVoiceState('idle')
      setStatusMessage(null)
      speakText(errorReply)
    }
  }

  const handleMicPress = () => {
    if (voiceState !== 'idle') return

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      setStatusMessage('Speech recognition is not supported in this browser. You can type your question below.')
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.lang = speechLangMap[lang] || 'en-IN'
      recognition.interimResults = false
      recognition.maxAlternatives = 1

      setVoiceState('listening')
      setStatusMessage('Listening... Speak now.')

      recognition.onresult = (event: any) => {
        const spokenText = event.results[0][0].transcript
        recognition.stop()
        processQuery(spokenText)
      }

      recognition.onerror = (event: any) => {
        console.warn('[VOICE] Speech recognition error:', event.error)
        setVoiceState('idle')
        setStatusMessage('Voice recognition error or microphone access denied. You can type below.')
      }

      recognition.onend = () => {
        if (voiceState === 'listening') {
          setVoiceState('idle')
        }
      }

      recognition.start()
    } catch (err) {
      console.warn('[VOICE] Recognition start error:', err)
      setVoiceState('idle')
      setStatusMessage('Microphone unavailable. You can type your question below.')
    }
  }

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!textInput.trim() || voiceState === 'processing') return
    const text = textInput.trim()
    setTextInput('')
    processQuery(text)
  }

  const MIC_STYLES: Record<VoiceState, string> = {
    idle: 'bg-forest text-cream hover:bg-leaf shadow-lg cursor-pointer',
    listening: 'bg-risk text-cream shadow-xl scale-105 animate-pulse',
    processing: 'bg-harvest text-cream shadow-lg animate-spin',
    responding: 'bg-meadow text-cream shadow-md',
  }

  const SUGGESTED_PROMPTS: Record<Lang, { label: string; query: string }[]> = {
    en: [
      { label: "⛅ Show today's weather", query: "Show today's weather" },
      { label: "🌾 How is my crop health?", query: "How is my crop health?" },
      { label: "◎ Show my soil report", query: "Show my soil report" },
      { label: "◈ Open My Farm", query: "Open My Farm" },
      { label: "◐ What should I do today?", query: "What should I do today?" },
      { label: "📍 Update location to Kakinada", query: "Update my location to Kakinada" },
    ],
    te: [
      { label: "⛅ ఈరోజు వాతావరణం ఎలా ఉంది?", query: "ఈరోజు వాతావరణం చూపించు" },
      { label: "🌾 నా పంట ఆరోగ్యం ఎలా ఉంది?", query: "పంట ఆరోగ్యం ఎలా ఉంది?" },
      { label: "◎ నా మట్టి నివేదిక చూపించు", query: "మట్టి నివేదిక చూపించు" },
      { label: "◈ నా పొలం వివరాలు తెరవండి", query: "నా పొలం తెరవండి" },
      { label: "◐ ఈరోజు నేను ఏమి చేయాలి?", query: "ఈరోజు నేను ఏమి చేయాలి?" },
      { label: "📍 స్థానాన్ని గుంటూరు గా మార్చు", query: "స్థానాన్ని గుంటూరు గా మార్చు" },
    ],
    ta: [
      { label: "⛅ இன்றைய வானிலை என்ன?", query: "இன்றைய வானிலை காட்டு" },
      { label: "🌾 எனது பயிர் ஆரோக்கியம் எப்படி உள்ளது?", query: "பயிர் ஆரோக்கியம் எப்படி உள்ளது?" },
      { label: "◎ எனது மண் அறிக்கை காட்டு", query: "மண் அறிக்கை காட்டு" },
      { label: "◈ என் பண்ணையைத் திறக்கவும்", query: "என் பண்ணையைத் திறக்கவும்" },
      { label: "◐ இன்று நான் என்ன செய்ய வேண்டும்?", query: "இன்று நான் என்ன செய்ய வேண்டும்?" },
    ],
    hi: [
      { label: "⛅ आज का मौसम कैसा है?", query: "आज का मौसम दिखाओ" },
      { label: "🌾 मेरी फसल का स्वास्थ्य कैसा है?", query: "मेरी फसल का स्वास्थ्य कैसा है?" },
      { label: "◎ मेरी मिट्टी रिपोर्ट दिखाओ", query: "मिट्टी रिपोर्ट दिखाओ" },
      { label: "◈ मेरा खेत विवरण खोलें", query: "मेरा खेत खोलो" },
      { label: "◐ आज मुझे क्या करना चाहिए?", query: "आज मुझे क्या करना चाहिए?" },
    ],
  }

  const activePrompts = SUGGESTED_PROMPTS[lang] || SUGGESTED_PROMPTS.en

  return (
    <div className="min-h-full flex flex-col p-6 max-w-3xl mx-auto gap-6">
      {/* Header */}
      <div className="text-center pt-2">
        <h1 className="font-display text-3xl text-charcoal font-bold">{t('voice_title')}</h1>
        <p className="text-sage text-sm mt-1">{t('voice_sub')}</p>
      </div>

      {/* Language Selector */}
      <div className="flex justify-center">
        <div className="flex items-center border border-pebble bg-white rounded-xl overflow-hidden shadow-sm p-0.5">
          {(Object.keys(LANG_LABELS) as (keyof typeof LANG_LABELS)[]).map((code) => (
            <button
              key={code}
              onClick={() => setLang(code)}
              className={`px-4 py-1.5 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                lang === code ? 'bg-forest text-cream font-semibold shadow-sm' : 'text-sage hover:text-charcoal hover:bg-mist'
              }`}
            >
              {LANG_LABELS[code]}
            </button>
          ))}
        </div>
      </div>

      {/* Central Mic & Status Area */}
      <div className="flex flex-col items-center gap-4 py-2">
        <div className="relative flex items-center justify-center w-36 h-36">
          {voiceState === 'listening' && (
            <>
              <div className="absolute w-36 h-36 rounded-full bg-risk/20 pulse-ring" />
              <div className="absolute w-28 h-28 rounded-full bg-risk/30 pulse-ring" style={{ animationDelay: '0.4s' }} />
            </>
          )}
          <button
            id="voice-assistant-mic-btn"
            onClick={handleMicPress}
            disabled={voiceState !== 'idle'}
            className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${MIC_STYLES[voiceState]}`}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="22"/>
            </svg>
          </button>
        </div>

        {/* State / Status Feedback */}
        <div className="text-center min-h-[1.5rem]">
          {voiceState === 'idle' && (
            <p className="text-sage text-xs font-mono uppercase tracking-wide">Tap mic to speak or type below</p>
          )}
          {voiceState === 'listening' && (
            <div className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-risk animate-ping" />
              <span className="text-risk font-semibold text-xs font-mono uppercase tracking-wide">Listening... Speak now</span>
            </div>
          )}
          {voiceState === 'processing' && (
            <p className="text-harvest font-semibold text-xs font-mono uppercase tracking-wide">Consulting Agricultural AI Models...</p>
          )}
          {voiceState === 'responding' && (
            <p className="text-meadow font-semibold text-xs font-mono uppercase tracking-wide">Speaking advisory response...</p>
          )}
          {statusMessage && voiceState === 'idle' && (
            <p className="text-sage text-xs mt-1 text-amber-700 bg-amber-50 px-3 py-1 rounded-md border border-amber-200">{statusMessage}</p>
          )}
        </div>
      </div>

      {/* Interactive Text Input Box */}
      <form onSubmit={handleTextSubmit} className="flex gap-2">
        <input
          type="text"
          id="assistant-text-input"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder={
            lang === 'te'
              ? 'ప్రశ్నను ఇక్కడ టైప్ చేయండి (ఉదా: ఈరోజు వాతావరణం, మట్టి నివేదిక)...'
              : lang === 'ta'
              ? 'உங்கள் கேள்வியை இங்கே தட்டச்சு செய்யவும்...'
              : lang === 'hi'
              ? 'अपना प्रश्न यहाँ टाइप करें (उदा: आज का मौसम, मिट्टी रिपोर्ट)...'
              : "Type your farming question (e.g. What's the weather today?, Open My Farm)..."
          }
          className="flex-1 px-4 py-3 rounded-xl border border-pebble bg-white text-charcoal placeholder:text-sage/50 text-sm focus:outline-none focus:ring-2 focus:ring-leaf/40 shadow-sm"
        />
        <button
          type="submit"
          id="assistant-submit-btn"
          disabled={!textInput.trim() || voiceState === 'processing'}
          className="px-6 py-3 bg-forest text-cream font-semibold text-sm rounded-xl hover:bg-leaf transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
        >
          Ask AI
        </button>
      </form>

      {/* Active Response Display */}
      {currentResponse && lastQuery && (
        <div className="space-y-3 step-in" ref={responsePanelRef}>
          <div className="bg-forest/8 border border-forest/20 rounded-2xl p-4 shadow-sm">
            <div className="text-xs font-mono uppercase tracking-widest text-forest font-semibold mb-1">
              You Asked
            </div>
            <p className="text-charcoal font-medium text-sm">"{lastQuery}"</p>
          </div>

          <div className="bg-white border border-leaf/30 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-mono uppercase tracking-widest text-leaf font-bold flex items-center gap-1.5">
                <span>🤖</span>
                <span>FarmAssist AI Response</span>
              </div>
              <button
                onClick={() => speakText(currentResponse)}
                className="text-xs text-forest hover:text-leaf font-medium flex items-center gap-1 bg-forest/8 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                <span>🔊</span>
                <span>Speak Again</span>
              </button>
            </div>

            <p className="text-charcoal text-sm leading-relaxed whitespace-pre-line font-sans">
              {currentResponse}
            </p>
          </div>
        </div>
      )}

      {/* Suggested Quick Questions */}
      <div className="space-y-2.5">
        <div className="text-xs font-mono uppercase tracking-widest text-sage font-semibold">
          Try asking or clicking:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {activePrompts.map((p) => (
            <button
              key={p.query}
              onClick={() => processQuery(p.query)}
              className="text-left text-xs text-charcoal/80 bg-white border border-pebble rounded-xl px-3.5 py-2.5 hover:border-leaf/50 hover:bg-mist/40 transition-all shadow-xs cursor-pointer flex items-center justify-between"
            >
              <span>{p.label}</span>
              <span className="text-leaf text-xs font-mono">→</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Conversation History */}
      {history.length > 1 && (
        <div className="space-y-2 pt-2 border-t border-pebble/60">
          <div className="text-xs font-mono uppercase tracking-widest text-sage font-semibold">
            Recent Conversation
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {history.slice(-6).map((msg, i) => (
              <div
                key={i}
                className={`rounded-xl p-3 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-forest/10 text-forest ml-8 font-medium'
                    : 'bg-white border border-pebble text-charcoal/80 mr-8 shadow-xs'
                }`}
              >
                <div className="text-2xs font-mono text-sage uppercase mb-0.5">
                  {msg.role === 'user' ? 'You' : 'FarmAssist AI'}:
                </div>
                {msg.text}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
