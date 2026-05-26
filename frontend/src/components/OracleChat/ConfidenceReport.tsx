import { motion } from 'framer-motion'
import type { ConfidenceReport } from '../../lib/types'

interface Props { confidence: ConfidenceReport }

const METRICS = [
  { key: 'personal_evidence_score', label: 'Personal Evidence' },
  { key: 'theory_alignment_score', label: 'Theory Alignment' },
  { key: 'cross_consistency_score', label: 'Cross-Consistency' },
  { key: 'temporal_relevance_score', label: 'Temporal Relevance' },
  { key: 'source_citation_rate', label: 'Source Citation Rate' },
] as const

export default function ConfidenceReportCard({ confidence }: Props) {
  const pct = Math.round(confidence.overall_confidence * 100)
  const met = confidence.threshold_met

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card mb-3 border ${met ? 'border-soul-gold/40' : 'border-orange-500/40'}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-soul-ivory-dim text-xs uppercase tracking-widest">Confidence Report</span>
        <span className={`font-serif text-lg font-semibold ${met ? 'text-soul-gold' : 'text-orange-400'}`}>
          {pct}% {met ? '✓' : '⚠'}
        </span>
      </div>

      <div className="space-y-1.5">
        {METRICS.map(({ key, label }) => {
          const val = confidence[key]
          const w = Math.round(val * 100)
          return (
            <div key={key} className="flex items-center gap-2">
              <span className="text-soul-ivory-dim text-xs w-36 shrink-0">{label}</span>
              <div className="flex-1 h-1.5 bg-soul-border rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${w}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className={`h-full rounded-full ${met ? 'bg-soul-gold' : 'bg-orange-400'}`}
                />
              </div>
              <span className="text-soul-ivory-dim text-xs w-8 text-right">{w}%</span>
            </div>
          )
        })}
      </div>

      <div className="mt-2 flex gap-3 text-xs text-soul-ivory-dim">
        <span>{confidence.entries_used} entries</span>
        <span>·</span>
        <span>{confidence.theories_used} theories</span>
      </div>
    </motion.div>
  )
}
