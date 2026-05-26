import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { format, parseISO, isSameDay } from 'date-fns'
import { Clock, CalendarDays, X } from 'lucide-react'
import { listEntries } from '../lib/api'
import type { Entry, EntryType } from '../lib/types'

const ENTRY_TYPE_COLORS: Record<EntryType, string> = {
  thought: 'bg-blue-900/50 text-blue-300 border border-blue-700/50',
  memory: 'bg-purple-900/50 text-purple-300 border border-purple-700/50',
  lesson: 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50',
  idea: 'bg-amber-900/50 text-amber-300 border border-amber-700/50',
  event: 'bg-sky-900/50 text-sky-300 border border-sky-700/50',
  person_note: 'bg-pink-900/50 text-pink-300 border border-pink-700/50',
  milestone: 'bg-yellow-900/50 text-yellow-300 border border-yellow-700/50',
  emotion_log: 'bg-rose-900/50 text-rose-300 border border-rose-700/50',
}

const ENTRY_DOT_COLORS: Record<EntryType, string> = {
  thought: 'bg-blue-400',
  memory: 'bg-purple-400',
  lesson: 'bg-emerald-400',
  idea: 'bg-amber-400',
  event: 'bg-sky-400',
  person_note: 'bg-pink-400',
  milestone: 'bg-yellow-400',
  emotion_log: 'bg-rose-400',
}

const TYPE_LABELS: Record<string, string> = {
  thought:     'Thoughts',
  memory:      'Memories',
  lesson:      'Lessons',
  idea:        'Ideas',
  event:       'Events',
  person_note: 'People',
  milestone:   'Milestones',
  emotion_log: 'Emotions',
}

function groupByMonth(entries: Entry[]): Map<string, Entry[]> {
  const map = new Map<string, Entry[]>()
  for (const entry of entries) {
    const key = format(parseISO(entry.created_at), 'MMMM yyyy')
    const existing = map.get(key) ?? []
    existing.push(entry)
    map.set(key, existing)
  }
  return map
}

function TimelineEntry({ entry, index }: { entry: Entry; index: number }) {
  const truncated =
    entry.raw_content.length > 160
      ? entry.raw_content.slice(0, 160) + '…'
      : entry.raw_content

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="flex gap-4 group"
    >
      {/* Date column */}
      <div className="w-20 flex-shrink-0 text-right pt-1">
        <span className="text-soul-ivory-dim text-xs leading-tight block">
          {format(parseISO(entry.created_at), 'MMM d')}
        </span>
        <span className="text-soul-ivory-dim/60 text-xs block">
          {format(parseISO(entry.created_at), 'h:mm a')}
        </span>
      </div>

      {/* Vertical line + dot */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div
          className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ring-2 ring-soul-bg transition-transform group-hover:scale-125 ${ENTRY_DOT_COLORS[entry.entry_type]}`}
        />
        <div className="w-px flex-1 bg-soul-border mt-1" />
      </div>

      {/* Content card */}
      <div className="flex-1 pb-6">
        <div className="card group-hover:border-soul-gold/40 transition-colors space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`badge ${ENTRY_TYPE_COLORS[entry.entry_type]}`}>
              {entry.entry_type.replace('_', ' ')}
            </span>
            {entry.emotion && (
              <span className="text-xs text-soul-ivory-dim italic">{entry.emotion}</span>
            )}
          </div>
          <p className="text-soul-ivory text-sm leading-relaxed">{truncated}</p>
          {entry.themes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {entry.themes.map((t) => (
                <span key={t} className="badge bg-soul-border/60 text-soul-ivory-dim">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function Timeline() {
  const [filter, setFilter]       = useState('all')
  const [dateFilter, setDateFilter] = useState('')   // ISO date string YYYY-MM-DD

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['entries', { limit: 200 }],
    queryFn: () => listEntries({ limit: 200 }),
  })

  // Build filter tabs from types that actually exist in the data
  const typeCounts = entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.entry_type] = (acc[e.entry_type] ?? 0) + 1
    return acc
  }, {})

  const filterOptions = [
    { label: 'All', value: 'all', count: entries.length },
    ...Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({
        label: TYPE_LABELS[type] ?? type.replace('_', ' '),
        value: type,
        count,
      })),
  ]

  // Apply both type filter and date filter
  let filtered = filter === 'all' ? entries : entries.filter(e => e.entry_type === filter)
  if (dateFilter) {
    const pickedDate = parseISO(dateFilter)
    filtered = filtered.filter(e => isSameDay(parseISO(e.created_at), pickedDate))
  }

  const groups = groupByMonth(filtered)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Clock className="w-5 h-5 text-soul-gold" />
        <h1 className="font-serif text-2xl text-soul-ivory">Timeline</h1>
      </div>

      {/* Date picker */}
      {!isLoading && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-soul-surface border border-soul-border rounded-xl px-3 py-2">
            <CalendarDays className="w-4 h-4 text-soul-gold shrink-0" />
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="bg-transparent text-soul-ivory text-sm focus:outline-none"
            />
          </div>
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="flex items-center gap-1.5 text-sm text-soul-ivory-dim hover:text-soul-ivory transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Clear date
            </button>
          )}
          {dateFilter && (
            <span className="text-soul-ivory-dim text-sm">
              {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'} on {format(parseISO(dateFilter), 'MMMM d, yyyy')}
            </span>
          )}
        </div>
      )}

      {/* Type filter tabs — built from actual data */}
      {!isLoading && entries.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filter === opt.value
                  ? 'bg-soul-gold text-soul-bg font-semibold'
                  : 'bg-soul-surface border border-soul-border text-soul-ivory-dim hover:text-soul-ivory hover:border-soul-gold/40'
              }`}
            >
              {opt.label}
              <span className={`text-xs rounded-full px-1.5 py-0.5 ${
                filter === opt.value
                  ? 'bg-soul-bg/20 text-soul-bg'
                  : 'bg-soul-border text-soul-ivory-dim'
              }`}>
                {opt.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-soul-gold border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="card text-center py-16">
          <Clock className="w-8 h-8 text-soul-gold mx-auto mb-3 opacity-40" />
          <p className="text-soul-ivory-dim">No entries found.</p>
        </div>
      )}

      {/* Timeline groups */}
      <div className="space-y-8">
        {Array.from(groups.entries()).map(([month, monthEntries]) => (
          <section key={month}>
            <h2 className="font-serif text-soul-gold text-lg mb-4 sticky top-0 bg-soul-bg/90 backdrop-blur-sm py-2">
              {month}
              <span className="text-soul-ivory-dim text-sm font-sans ml-2">
                · {monthEntries.length} entries
              </span>
            </h2>
            <div>
              {monthEntries.map((entry, i) => (
                <TimelineEntry key={entry.id} entry={entry} index={i} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
