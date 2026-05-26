import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { Brain, TrendingUp, AlertCircle } from 'lucide-react'
import { getPatterns, getPsychologyProfile } from '../../lib/api'
import type { Pattern } from '../../lib/types'

const PATTERN_COLORS: Record<string, string> = {
  emotional_cycle: 'bg-blue-900/50 text-blue-300 border border-blue-700/50',
  decision_pattern: 'bg-yellow-900/50 text-yellow-300 border border-yellow-700/50',
  fear_trigger: 'bg-rose-900/50 text-rose-300 border border-rose-700/50',
  growth_arc: 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50',
  idea_recurrence: 'bg-amber-900/50 text-amber-300 border border-amber-700/50',
  relationship_pattern: 'bg-purple-900/50 text-purple-300 border border-purple-700/50',
  energy_cycle: 'bg-sky-900/50 text-sky-300 border border-sky-700/50',
}

const PATTERN_BAR_COLORS: Record<string, string> = {
  emotional_cycle: 'bg-blue-400',
  decision_pattern: 'bg-yellow-400',
  fear_trigger: 'bg-rose-400',
  growth_arc: 'bg-emerald-400',
  idea_recurrence: 'bg-amber-400',
  relationship_pattern: 'bg-purple-400',
  energy_cycle: 'bg-sky-400',
}

function getPatternColor(type: string) {
  return PATTERN_COLORS[type] ?? 'bg-gray-700/50 text-gray-300 border border-gray-600/50'
}

function getPatternBarColor(type: string) {
  return PATTERN_BAR_COLORS[type] ?? 'bg-gray-400'
}

function PatternCard({ pattern, index }: { pattern: Pattern; index: number }) {
  const pct = Math.round(pattern.confidence * 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      className="card space-y-3"
    >
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <span className={`badge ${getPatternColor(pattern.pattern_type)}`}>
          {pattern.pattern_type.replace(/_/g, ' ')}
        </span>
        <span className="text-xs text-soul-ivory-dim">
          {format(parseISO(pattern.detected_at), 'MMM d, yyyy')}
        </span>
      </div>

      <p className="text-soul-ivory text-sm leading-relaxed">{pattern.description}</p>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-soul-ivory-dim">Confidence</span>
          <span className="text-soul-ivory font-medium">{pct}%</span>
        </div>
        <div className="h-1.5 bg-soul-border rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ delay: index * 0.06 + 0.2, duration: 0.6, ease: 'easeOut' }}
            className={`h-full rounded-full ${getPatternBarColor(pattern.pattern_type)}`}
          />
        </div>
      </div>
    </motion.div>
  )
}

interface PsychologyProfile {
  core_values?: string[]
  fear_patterns?: string[]
  decision_style?: string
  emotional_baseline?: string
  recurring_themes?: string[]
}

function PsychologyCard({ profile }: { profile: PsychologyProfile }) {
  return (
    <div className="card space-y-5">
      <div className="flex items-center gap-3">
        <Brain className="w-5 h-5 text-soul-gold" />
        <h2 className="font-serif text-xl text-soul-ivory">Your Psychology</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {profile.core_values && profile.core_values.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-soul-ivory-dim text-xs uppercase tracking-wider">Core values</h3>
            <div className="flex flex-wrap gap-1.5">
              {profile.core_values.map((v) => (
                <span key={v} className="badge bg-soul-gold/20 text-soul-gold border border-soul-gold/30">
                  {v}
                </span>
              ))}
            </div>
          </div>
        )}

        {profile.fear_patterns && profile.fear_patterns.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-soul-ivory-dim text-xs uppercase tracking-wider">Fear patterns</h3>
            <div className="flex flex-wrap gap-1.5">
              {profile.fear_patterns.map((f) => (
                <span key={f} className="badge bg-rose-900/30 text-rose-400 border border-rose-700/30">
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {profile.recurring_themes && profile.recurring_themes.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-soul-ivory-dim text-xs uppercase tracking-wider">Recurring themes</h3>
            <div className="flex flex-wrap gap-1.5">
              {profile.recurring_themes.map((t) => (
                <span key={t} className="badge bg-purple-900/30 text-purple-400 border border-purple-700/30">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          {profile.decision_style && (
            <div>
              <h3 className="text-soul-ivory-dim text-xs uppercase tracking-wider mb-1">
                Decision style
              </h3>
              <p className="text-soul-ivory text-sm">{profile.decision_style}</p>
            </div>
          )}
          {profile.emotional_baseline && (
            <div>
              <h3 className="text-soul-ivory-dim text-xs uppercase tracking-wider mb-1">
                Emotional baseline
              </h3>
              <p className="text-soul-ivory text-sm">{profile.emotional_baseline}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Patterns() {
  const { data: patterns = [], isLoading: patternsLoading } = useQuery({
    queryKey: ['patterns'],
    queryFn: getPatterns,
  })

  const { data: psychProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['psychologyProfile'],
    queryFn: getPsychologyProfile,
  })

  const isLoading = patternsLoading || profileLoading

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <TrendingUp className="w-5 h-5 text-soul-gold" />
        <h1 className="font-serif text-2xl text-soul-ivory">Patterns</h1>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-soul-gold border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && (
        <div className="flex-1 overflow-y-auto space-y-8 min-h-0">
          {/* Psychology profile */}
          {psychProfile && Object.keys(psychProfile).length > 0 ? (
            <PsychologyCard profile={psychProfile as PsychologyProfile} />
          ) : (
            <div className="card flex items-center gap-4 py-5">
              <Brain className="w-8 h-8 text-soul-gold opacity-40 flex-shrink-0" />
              <div>
                <p className="text-soul-ivory font-medium">Psychology profile not yet built</p>
                <p className="text-soul-ivory-dim text-sm">
                  Keep journaling — a profile emerges after enough entries.
                </p>
              </div>
            </div>
          )}

          {/* Patterns grid */}
          <section className="space-y-4">
            <h2 className="font-serif text-xl text-soul-ivory">Detected patterns</h2>

            {patterns.length === 0 ? (
              <div className="card flex items-center gap-4 py-8 text-center flex-col">
                <AlertCircle className="w-8 h-8 text-soul-ivory-dim opacity-40" />
                <div>
                  <p className="text-soul-ivory-dim">No patterns detected yet.</p>
                  <p className="text-soul-ivory-dim text-sm mt-1">
                    Keep journaling — patterns emerge after 20+ entries.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {patterns.map((pattern, i) => (
                  <PatternCard key={pattern.id} pattern={pattern} index={i} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
