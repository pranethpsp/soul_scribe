import { useQuery } from '@tanstack/react-query'
import { getInsights } from '../../lib/api'
import { motion } from 'framer-motion'
import { Calendar, TrendingUp, Star, RefreshCw, X } from 'lucide-react'
import type { InsightItem } from '../../lib/types'

const ICONS: Record<InsightItem['type'], typeof Calendar> = {
  upcoming_event:     Calendar,
  pattern:            TrendingUp,
  memory_anniversary: Star,
  dormant_connection: RefreshCw,
  recurring_idea:     RefreshCw,
}

const COLOURS: Record<InsightItem['type'], string> = {
  upcoming_event:     'text-blue-400',
  pattern:            'text-soul-gold',
  memory_anniversary: 'text-purple-400',
  dormant_connection: 'text-green-400',
  recurring_idea:     'text-orange-400',
}

interface InsightPanelProps {
  onClose?: () => void
}

export default function InsightPanel({ onClose }: InsightPanelProps) {
  const { data: insights = [] } = useQuery({
    queryKey: ['insights'],
    queryFn: getInsights,
    refetchInterval: 60_000,
  })

  return (
    <aside className="w-72 bg-soul-surface/30 border-l border-soul-border flex flex-col h-full">
      <div className="px-4 py-4 border-b border-soul-border flex items-center justify-between">
        <h2 className="text-soul-ivory font-serif text-sm font-semibold">Surfacing Now</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-soul-ivory-dim hover:text-soul-ivory hover:bg-soul-surface transition-colors"
            aria-label="Close insights"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {insights.length === 0 && (
          <p className="text-soul-ivory-dim text-xs text-center py-8">
            Add entries to see insights here.
          </p>
        )}
        {insights.map((item, i) => {
          const Icon   = ICONS[item.type]  || Star
          const colour = COLOURS[item.type] || 'text-soul-gold'
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card hover:border-soul-gold/30 transition-colors cursor-default"
            >
              <div className="flex items-start gap-2.5">
                <Icon size={14} className={`${colour} mt-0.5 shrink-0`} />
                <div className="min-w-0">
                  <p className="text-soul-ivory text-xs font-medium leading-snug">{item.title}</p>
                  <p className="text-soul-ivory-dim text-xs mt-1 leading-relaxed">{item.description}</p>
                  {item.action_hint && (
                    <p className="text-soul-gold text-xs mt-1.5">{item.action_hint}</p>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </aside>
  )
}
