import { Sparkles } from 'lucide-react'
import OracleChat from '../components/OracleChat'

export default function Oracle() {
  return (
    <div className="h-full flex flex-col gap-0">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-soul-border flex-shrink-0">
        <div className="w-9 h-9 rounded-lg bg-soul-gold/10 border border-soul-gold/30 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-soul-gold" />
        </div>
        <div>
          <h1 className="font-serif text-xl text-soul-ivory leading-tight">Oracle</h1>
          <p className="text-soul-ivory-dim text-sm">Ask anything about your life</p>
        </div>
      </div>

      {/* Chat takes remaining height */}
      <div className="flex-1 min-h-0 pt-4">
        <OracleChat />
      </div>
    </div>
  )
}
