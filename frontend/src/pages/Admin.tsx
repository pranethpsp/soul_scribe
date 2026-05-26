import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { ShieldAlert, Upload, Trash2, Activity, Zap, Loader2, FileText } from 'lucide-react'
import { listVault, uploadVault, removeFromVault, triggerPatternAnalysis, getMetrics } from '../lib/api'

const DOMAIN_OPTIONS = [
  'psychology',
  'philosophy',
  'neuroscience',
  'spirituality',
  'productivity',
  'relationships',
  'health',
  'finance',
  'other',
]

const THEORY_TYPE_OPTIONS = [
  'framework',
  'model',
  'principle',
  'research',
  'methodology',
  'concept',
]

interface VaultEntry {
  source_id: string
  title: string
  author: string
  domain: string
  chunk_count: number
  retrieval_count: number
  is_active: boolean
}

interface MetricRow {
  [key: string]: unknown
}

// ── Upload Form ───────────────────────────────────────────────────────────────

function UploadForm({ onSuccess }: { onSuccess: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    title: '',
    author: '',
    domain: 'psychology',
    theory_type: 'framework',
    summary: '',
    text_content: '',
  })
  const [file, setFile] = useState<File | null>(null)
  const [useFile, setUseFile] = useState(false)

  const mutation = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      fd.append('title', form.title)
      fd.append('author', form.author)
      fd.append('domain', form.domain)
      fd.append('theory_type', form.theory_type)
      if (form.summary) fd.append('summary', form.summary)
      if (useFile && file) {
        fd.append('file', file)
      } else {
        fd.append('text_content', form.text_content)
      }
      return uploadVault(fd)
    },
    onSuccess: () => {
      setForm({
        title: '',
        author: '',
        domain: 'psychology',
        theory_type: 'framework',
        summary: '',
        text_content: '',
      })
      setFile(null)
      if (fileRef.current) fileRef.current.value = ''
      onSuccess()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.author) return
    if (!useFile && !form.text_content.trim()) return
    if (useFile && !file) return
    mutation.mutate()
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h2 className="font-serif text-lg text-soul-ivory flex items-center gap-2">
        <Upload className="w-4 h-4 text-soul-gold" />
        Upload to Knowledge Vault
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-soul-ivory-dim mb-1.5">Title *</label>
          <input
            type="text"
            className="input-soul"
            placeholder="e.g. Thinking, Fast and Slow"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="block text-sm text-soul-ivory-dim mb-1.5">Author *</label>
          <input
            type="text"
            className="input-soul"
            placeholder="e.g. Daniel Kahneman"
            value={form.author}
            onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="block text-sm text-soul-ivory-dim mb-1.5">Domain</label>
          <select
            className="input-soul appearance-none"
            value={form.domain}
            onChange={(e) => setForm((f) => ({ ...f, domain: e.target.value }))}
          >
            {DOMAIN_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-soul-ivory-dim mb-1.5">Theory type</label>
          <select
            className="input-soul appearance-none"
            value={form.theory_type}
            onChange={(e) => setForm((f) => ({ ...f, theory_type: e.target.value }))}
          >
            {THEORY_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm text-soul-ivory-dim mb-1.5">Summary (optional)</label>
        <input
          type="text"
          className="input-soul"
          placeholder="Brief description of this source"
          value={form.summary}
          onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
        />
      </div>

      {/* Toggle: text vs file */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setUseFile(false)}
          className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
            !useFile ? 'bg-soul-gold text-soul-bg font-medium' : 'btn-ghost'
          }`}
        >
          Paste text
        </button>
        <button
          type="button"
          onClick={() => setUseFile(true)}
          className={`px-3 py-1.5 rounded-md text-sm transition-colors flex items-center gap-1.5 ${
            useFile ? 'bg-soul-gold text-soul-bg font-medium' : 'btn-ghost'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Upload file
        </button>
      </div>

      {!useFile ? (
        <div>
          <label className="block text-sm text-soul-ivory-dim mb-1.5">Text content *</label>
          <textarea
            className="input-soul resize-none min-h-[140px]"
            placeholder="Paste the full text content here…"
            value={form.text_content}
            onChange={(e) => setForm((f) => ({ ...f, text_content: e.target.value }))}
            required={!useFile}
          />
        </div>
      ) : (
        <div>
          <label className="block text-sm text-soul-ivory-dim mb-1.5">File *</label>
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.md,.pdf"
            className="input-soul file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-soul-gold file:text-soul-bg file:text-sm file:cursor-pointer cursor-pointer"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            required={useFile}
          />
        </div>
      )}

      {mutation.isError && (
        <p className="text-rose-400 text-sm">Upload failed — please check your inputs and try again.</p>
      )}
      {mutation.isSuccess && (
        <p className="text-emerald-400 text-sm">Uploaded successfully.</p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          className="btn-gold flex items-center gap-2 disabled:opacity-50"
          disabled={mutation.isPending}
        >
          {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Upload
        </button>
      </div>
    </form>
  )
}

// ── Vault Table ───────────────────────────────────────────────────────────────

function VaultTable() {
  const queryClient = useQueryClient()

  const { data: vault = [], isLoading, refetch } = useQuery({
    queryKey: ['vault'],
    queryFn: listVault,
  })

  const deleteMutation = useMutation({
    mutationFn: (sourceId: string) => removeFromVault(sourceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault'] })
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-5 h-5 text-soul-gold animate-spin" />
      </div>
    )
  }

  const entries = Array.isArray(vault) ? (vault as VaultEntry[]) : []

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg text-soul-ivory">Knowledge Vault</h2>
        <span className="text-soul-ivory-dim text-sm">{entries.length} sources</span>
      </div>

      {entries.length === 0 ? (
        <p className="text-soul-ivory-dim text-sm text-center py-6">No vault entries yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-soul-border text-soul-ivory-dim text-left">
                <th className="pb-2 pr-4 font-medium">Title</th>
                <th className="pb-2 pr-4 font-medium">Author</th>
                <th className="pb-2 pr-4 font-medium">Domain</th>
                <th className="pb-2 pr-4 font-medium text-center">Chunks</th>
                <th className="pb-2 pr-4 font-medium text-center">Retrievals</th>
                <th className="pb-2 pr-4 font-medium text-center">Active</th>
                <th className="pb-2 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-soul-border/50">
              {entries.map((entry) => (
                <tr key={entry.source_id} className="hover:bg-soul-border/10 transition-colors">
                  <td className="py-2.5 pr-4 text-soul-ivory font-medium max-w-[200px] truncate">
                    {entry.title}
                  </td>
                  <td className="py-2.5 pr-4 text-soul-ivory-dim">{entry.author}</td>
                  <td className="py-2.5 pr-4">
                    <span className="badge bg-soul-border/60 text-soul-ivory-dim">{entry.domain}</span>
                  </td>
                  <td className="py-2.5 pr-4 text-center text-soul-ivory-dim">{entry.chunk_count}</td>
                  <td className="py-2.5 pr-4 text-center text-soul-ivory-dim">{entry.retrieval_count}</td>
                  <td className="py-2.5 pr-4 text-center">
                    <span
                      className={`badge ${
                        entry.is_active
                          ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-700/40'
                          : 'bg-gray-700/40 text-gray-400 border border-gray-600/40'
                      }`}
                    >
                      {entry.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <button
                      onClick={() => deleteMutation.mutate(entry.source_id)}
                      disabled={deleteMutation.isPending}
                      className="p-1.5 text-soul-ivory-dim hover:text-rose-400 rounded-md hover:bg-rose-900/20 transition-colors disabled:opacity-50"
                      title="Remove from vault"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Metrics Table ─────────────────────────────────────────────────────────────

function MetricsSection() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['metrics'],
    queryFn: getMetrics,
  })

  const rows = Array.isArray(metrics) ? (metrics as MetricRow[]) : metrics ? [metrics] : []

  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-soul-gold" />
        <h2 className="font-serif text-lg text-soul-ivory">Confidence Metrics</h2>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 text-soul-gold animate-spin" />
        </div>
      )}

      {!isLoading && rows.length === 0 && (
        <p className="text-soul-ivory-dim text-sm text-center py-4">No metrics data available.</p>
      )}

      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-soul-border text-soul-ivory-dim text-left">
                {Object.keys(rows[0]).map((k) => (
                  <th key={k} className="pb-2 pr-4 font-medium capitalize">
                    {k.replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-soul-border/50">
              {rows.map((row, i) => (
                <tr key={i} className="hover:bg-soul-border/10 transition-colors">
                  {Object.values(row).map((val, j) => (
                    <td key={j} className="py-2.5 pr-4 text-soul-ivory-dim">
                      {typeof val === 'number'
                        ? val % 1 !== 0
                          ? val.toFixed(3)
                          : val
                        : typeof val === 'boolean'
                        ? val
                          ? 'Yes'
                          : 'No'
                        : String(val ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function Admin() {
  const queryClient = useQueryClient()
  const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  const handleVaultUploadSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['vault'] })
  }

  const handleTriggerAnalysis = async () => {
    setAnalysisStatus('loading')
    try {
      await triggerPatternAnalysis()
      setAnalysisStatus('done')
      setTimeout(() => setAnalysisStatus('idle'), 4000)
    } catch {
      setAnalysisStatus('error')
      setTimeout(() => setAnalysisStatus('idle'), 4000)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Warning banner */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-900/20 border border-amber-600/40">
        <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0" />
        <div>
          <p className="text-amber-300 font-medium text-sm">Developer Mode — Knowledge Vault Manager</p>
          <p className="text-amber-300/70 text-xs">
            Changes here affect all AI responses. Proceed with care.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 min-h-0">
        {/* Section 1: Upload */}
        <UploadForm onSuccess={handleVaultUploadSuccess} />

        {/* Section 2: Vault table */}
        <VaultTable />

        {/* Section 3: Trigger analysis */}
        <div className="card space-y-3">
          <h2 className="font-serif text-lg text-soul-ivory flex items-center gap-2">
            <Zap className="w-4 h-4 text-soul-gold" />
            Pattern Analysis
          </h2>
          <p className="text-soul-ivory-dim text-sm">
            Manually trigger a full pattern analysis run across all journal entries.
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={handleTriggerAnalysis}
              disabled={analysisStatus === 'loading'}
              className="btn-gold flex items-center gap-2 disabled:opacity-50"
            >
              {analysisStatus === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
              {analysisStatus === 'loading' ? 'Analysing…' : 'Trigger Pattern Analysis'}
            </button>
            {analysisStatus === 'done' && (
              <span className="text-emerald-400 text-sm">Analysis triggered successfully.</span>
            )}
            {analysisStatus === 'error' && (
              <span className="text-rose-400 text-sm">Failed to trigger analysis.</span>
            )}
          </div>
        </div>

        {/* Section 4: Metrics */}
        <MetricsSection />
      </div>
    </div>
  )
}
