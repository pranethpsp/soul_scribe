import { useState, useRef, useEffect } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { chat } from '../../lib/api'
import ConfidenceReportCard from './ConfidenceReport'
import type { ChatMessage, EntryType } from '../../lib/types'

const ENTRY_COLOURS: Record<EntryType | string, string> = {
  thought: 'bg-blue-500/20 text-blue-300',
  memory: 'bg-purple-500/20 text-purple-300',
  lesson: 'bg-emerald-500/20 text-emerald-300',
  idea: 'bg-amber-500/20 text-amber-300',
  event: 'bg-sky-500/20 text-sky-300',
  person_note: 'bg-pink-500/20 text-pink-300',
  milestone: 'bg-soul-gold/20 text-soul-gold',
  emotion_log: 'bg-rose-500/20 text-rose-300',
}

function genId() {
  return Math.random().toString(36).slice(2)
}

export default function OracleChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const convId = useRef(genId())
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')

    const userMsg: ChatMessage = { id: genId(), role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const result = await chat(text, convId.current)
      let assistantMsg: ChatMessage

      if (result.type === 'oracle') {
        const resp = result.response!
        assistantMsg = {
          id: genId(),
          role: 'assistant',
          content: resp.answer,
          confidence: resp.confidence,
          citations: resp.citations,
          is_disclaimer: resp.is_honest_disclaimer,
        }
      } else {
        // Journal entry saved
        assistantMsg = {
          id: genId(),
          role: 'assistant',
          content: result.key_insight
            ? `Saved ✓  —  *"${result.key_insight}"*`
            : 'Entry saved to your soul.',
          entry_result: {
            entry_type: result.entry_type as EntryType,
            emotion: result.emotion || '',
            themes: result.themes || [],
            key_insight: result.key_insight || null,
          },
        }
      }
      setMessages(prev => [...prev, assistantMsg])
    } catch (e) {
      setMessages(prev => [
        ...prev,
        { id: genId(), role: 'assistant', content: 'Something went wrong. Try again.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="font-serif text-2xl text-soul-ivory mb-2">What's on your mind?</p>
            <p className="text-soul-ivory-dim text-sm">
              Share something about your day, or ask anything about your life.
            </p>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'user' ? (
                <div className="max-w-[70%] bg-soul-gold/10 border border-soul-gold/20 rounded-2xl rounded-tr-sm px-4 py-3">
                  <p className="text-soul-ivory text-sm leading-relaxed">{msg.content}</p>
                </div>
              ) : (
                <div className="max-w-[80%] space-y-2">
                  {msg.confidence && <ConfidenceReportCard confidence={msg.confidence} />}
                  <div className={`card ${msg.is_disclaimer ? 'border-orange-500/30' : ''}`}>
                    {msg.entry_result && (
                      <div className="flex gap-2 flex-wrap mb-2">
                        <span className={`badge ${ENTRY_COLOURS[msg.entry_result.entry_type] || 'bg-soul-border text-soul-ivory-dim'}`}>
                          {msg.entry_result.entry_type}
                        </span>
                        {msg.entry_result.emotion && (
                          <span className="badge bg-soul-border text-soul-ivory-dim">
                            {msg.entry_result.emotion}
                          </span>
                        )}
                        {msg.entry_result.themes.slice(0, 3).map(t => (
                          <span key={t} className="badge bg-soul-border/50 text-soul-ivory-dim">{t}</span>
                        ))}
                      </div>
                    )}
                    <p className="text-soul-ivory text-sm leading-relaxed whitespace-pre-line">{msg.content}</p>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="card flex items-center gap-2 text-soul-ivory-dim text-sm">
              <Loader2 size={14} className="animate-spin text-soul-gold" />
              Thinking…
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-soul-border px-6 py-4">
        <div className="flex gap-3 items-end">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            placeholder="Share something, or ask your soul…"
            rows={2}
            className="input-soul resize-none text-sm"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="btn-gold flex items-center gap-2 shrink-0 h-10"
          >
            <Send size={14} />
          </button>
        </div>
        <p className="text-soul-ivory-dim text-xs mt-1.5">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}
