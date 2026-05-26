import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { Lightbulb, PenLine, ArrowUpRight } from 'lucide-react'
import { listEntries } from '../../lib/api'
import type { Entry } from '../../lib/types'

function IdeaCard({ entry, index }: { entry: Entry; index: number }) {
  const title = entry.key_insight ?? entry.raw_content.slice(0, 80)
  const truncated =
    entry.raw_content.length > 160
      ? entry.raw_content.slice(0, 160) + '…'
      : entry.raw_content

  const relevance = entry.life_relevance_score

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ y: -2 }}
      className="card space-y-3 group hover:border-amber-600/40 transition-all cursor-default"
    >
      {/* Relevance bar */}
      {relevance > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 bg-soul-border rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all"
              style={{ width: `${Math.min(relevance * 100, 100)}%` }}
            />
          </div>
          <span className="text-xs text-soul-ivory-dim">
            {Math.round(relevance * 100)}% relevant
          </span>
        </div>
      )}

      {/* Title */}
      <div className="flex items-start gap-2">
        <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <h3 className="text-soul-ivory font-medium text-sm leading-snug line-clamp-2">
          {title}
        </h3>
      </div>

      {/* Body */}
      {entry.key_insight && (
        <p className="text-soul-ivory-dim text-xs leading-relaxed">{truncated}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
        <div className="flex flex-wrap gap-1.5">
          {entry.themes.slice(0, 3).map((theme) => (
            <span key={theme} className="badge bg-amber-900/30 text-amber-400 border border-amber-700/30">
              {theme}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-soul-ivory-dim">
          {entry.emotion && <span className="italic">{entry.emotion}</span>}
          <span>{format(parseISO(entry.created_at), 'MMM d, yyyy')}</span>
        </div>
      </div>
    </motion.div>
  )
}

export default function Ideas() {
  const navigate = useNavigate()

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['entries', { entry_type: 'idea', limit: 50 }],
    queryFn: () => listEntries({ entry_type: 'idea', limit: 50 }),
  })

  const sorted = [...entries].sort(
    (a, b) => b.life_relevance_score - a.life_relevance_score
  )

  const handleWriteIdea = () => {
    navigate('/today', { state: { focusComposer: true } })
  }

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Lightbulb className="w-5 h-5 text-amber-400" />
          <h1 className="font-serif text-2xl text-soul-ivory">Ideas</h1>
          {!isLoading && (
            <span className="text-soul-ivory-dim text-sm">
              · {entries.length} {entries.length === 1 ? 'idea' : 'ideas'} captured
            </span>
          )}
        </div>
        <button
          onClick={handleWriteIdea}
          className="btn-gold flex items-center gap-2"
        >
          <PenLine className="w-4 h-4" />
          Write an idea
        </button>
      </div>

      {/* Hint */}
      <div className="flex items-center gap-2 px-1 text-soul-ivory-dim text-sm">
        <ArrowUpRight className="w-4 h-4 text-amber-400 flex-shrink-0" />
        <span>Sorted by life relevance — your most meaningful ideas first</span>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty */}
      {!isLoading && entries.length === 0 && (
        <div className="card text-center py-16 space-y-3">
          <Lightbulb className="w-10 h-10 text-amber-400 mx-auto opacity-40" />
          <p className="text-soul-ivory-dim">No ideas captured yet.</p>
          <p className="text-soul-ivory-dim text-sm">
            Write your first idea in Today — the AI will classify it automatically.
          </p>
          <button onClick={handleWriteIdea} className="btn-gold mx-auto mt-2">
            Write an idea
          </button>
        </div>
      )}

      {/* Grid */}
      {!isLoading && sorted.length > 0 && (
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {sorted.map((entry, i) => (
              <IdeaCard key={entry.id} entry={entry} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
