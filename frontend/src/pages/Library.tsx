import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BookOpen, Upload, Trash2, Loader2, FileText, X } from 'lucide-react'
import { listLibrary, uploadLibrary, removeFromLibrary } from '../lib/api'

const DOMAIN_OPTIONS = ['psychology','philosophy','neuroscience','spirituality','productivity','relationships','health','finance','other']
const THEORY_TYPES   = ['framework','model','principle','research','methodology','concept']

interface VaultEntry {
  id: string
  title: string
  author?: string
  domain: string
  chunk_count: number
  retrieval_count: number
  is_active: boolean
}

function UploadForm({ onSuccess }: { onSuccess: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({ title: '', author: '', domain: 'psychology', theory_type: 'framework', summary: '', text_content: '' })
  const [file, setFile] = useState<File | null>(null)
  const [useFile, setUseFile] = useState(false)

  const mutation = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      fd.append('title', form.title)
      fd.append('author', form.author)
      fd.append('domain', form.domain)
      fd.append('theory_type', form.theory_type)
      if (form.summary)  fd.append('summary', form.summary)
      if (useFile && file) fd.append('file', file)
      else fd.append('text_content', form.text_content)
      return uploadLibrary(fd)
    },
    onSuccess: () => {
      setForm({ title: '', author: '', domain: 'psychology', theory_type: 'framework', summary: '', text_content: '' })
      setFile(null)
      if (fileRef.current) fileRef.current.value = ''
      onSuccess()
    },
  })

  const canSubmit = form.title && form.author && (useFile ? !!file : form.text_content.trim())

  return (
    <form
      onSubmit={e => { e.preventDefault(); if (canSubmit && !mutation.isPending) mutation.mutate() }}
      className="card space-y-4"
    >
      <h2 className="font-serif text-lg text-soul-ivory flex items-center gap-2">
        <Upload className="w-4 h-4 text-soul-gold" />
        Add to Knowledge Library
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-soul-ivory-dim mb-1.5">Title *</label>
          <input type="text" className="input-soul" placeholder="e.g. Thinking, Fast and Slow" value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
        </div>
        <div>
          <label className="block text-sm text-soul-ivory-dim mb-1.5">Author *</label>
          <input type="text" className="input-soul" placeholder="e.g. Daniel Kahneman" value={form.author}
            onChange={e => setForm(f => ({ ...f, author: e.target.value }))} required />
        </div>
        <div>
          <label className="block text-sm text-soul-ivory-dim mb-1.5">Domain</label>
          <select className="input-soul appearance-none" value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))}>
            {DOMAIN_OPTIONS.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-soul-ivory-dim mb-1.5">Theory type</label>
          <select className="input-soul appearance-none" value={form.theory_type} onChange={e => setForm(f => ({ ...f, theory_type: e.target.value }))}>
            {THEORY_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm text-soul-ivory-dim mb-1.5">Brief summary (optional)</label>
        <input type="text" className="input-soul" placeholder="What is this source about?" value={form.summary}
          onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} />
      </div>

      {/* Toggle */}
      <div className="flex gap-2">
        <button type="button" onClick={() => setUseFile(false)} className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${!useFile ? 'bg-soul-gold text-soul-bg font-medium' : 'btn-ghost'}`}>
          Paste text
        </button>
        <button type="button" onClick={() => setUseFile(true)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${useFile ? 'bg-soul-gold text-soul-bg font-medium' : 'btn-ghost'}`}>
          <FileText className="w-3.5 h-3.5" /> Upload file
        </button>
      </div>

      {!useFile ? (
        <textarea className="input-soul resize-none min-h-[140px]" placeholder="Paste full text content here…" value={form.text_content}
          onChange={e => setForm(f => ({ ...f, text_content: e.target.value }))} required={!useFile} />
      ) : (
        <input ref={fileRef} type="file" accept=".txt,.md,.pdf"
          className="input-soul file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-soul-gold file:text-soul-bg file:text-sm file:cursor-pointer cursor-pointer"
          onChange={e => setFile(e.target.files?.[0] ?? null)} required={useFile} />
      )}

      {mutation.isError && <p className="text-rose-400 text-sm">Upload failed — check your inputs and try again.</p>}
      {mutation.isSuccess && <p className="text-emerald-400 text-sm">Added to library successfully.</p>}

      <div className="flex justify-end">
        <button type="submit" disabled={!canSubmit || mutation.isPending} className="btn-gold flex items-center gap-2 disabled:opacity-50">
          {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Add to library
        </button>
      </div>
    </form>
  )
}

function LibraryTable() {
  const queryClient = useQueryClient()
  const { data = [], isLoading, refetch } = useQuery({ queryKey: ['library'], queryFn: listLibrary })

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeFromLibrary(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['library'] }),
  })

  const entries = data as VaultEntry[]

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg text-soul-ivory">Library ({entries.length} sources)</h2>
      </div>

      {isLoading && <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-soul-gold animate-spin" /></div>}

      {!isLoading && entries.length === 0 && (
        <p className="text-soul-ivory-dim text-sm text-center py-6">
          No sources yet. Add a book, research paper, or framework above — the Oracle will use it to give you richer, theory-backed answers.
        </p>
      )}

      {entries.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-soul-border text-soul-ivory-dim text-left">
                <th className="pb-2 pr-4 font-medium">Title</th>
                <th className="pb-2 pr-4 font-medium hidden sm:table-cell">Author</th>
                <th className="pb-2 pr-4 font-medium">Domain</th>
                <th className="pb-2 pr-4 font-medium text-center hidden md:table-cell">Chunks</th>
                <th className="pb-2 pr-4 font-medium text-center hidden md:table-cell">Used</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-soul-border/50">
              {entries.map(entry => (
                <tr key={entry.id} className="hover:bg-soul-border/10 transition-colors">
                  <td className="py-2.5 pr-4 text-soul-ivory font-medium max-w-[200px] truncate">{entry.title}</td>
                  <td className="py-2.5 pr-4 text-soul-ivory-dim hidden sm:table-cell">{entry.author || '—'}</td>
                  <td className="py-2.5 pr-4">
                    <span className="badge bg-soul-border/60 text-soul-ivory-dim">{entry.domain}</span>
                  </td>
                  <td className="py-2.5 pr-4 text-center text-soul-ivory-dim hidden md:table-cell">{entry.chunk_count}</td>
                  <td className="py-2.5 pr-4 text-center text-soul-ivory-dim hidden md:table-cell">{entry.retrieval_count}</td>
                  <td className="py-2.5">
                    <button
                      onClick={() => removeMutation.mutate(entry.id)}
                      disabled={removeMutation.isPending}
                      className="p-1.5 text-soul-ivory-dim hover:text-rose-400 rounded-md hover:bg-rose-900/20 transition-colors"
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

export default function Library() {
  const queryClient = useQueryClient()
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <BookOpen className="w-5 h-5 text-soul-gold" />
        <h1 className="font-serif text-2xl text-soul-ivory">Knowledge Library</h1>
      </div>
      <p className="text-soul-ivory-dim text-sm -mt-3">
        Add books, research papers, and frameworks. The Oracle uses them to give you theory-backed, personalised insights.
      </p>
      <UploadForm onSuccess={() => queryClient.invalidateQueries({ queryKey: ['library'] })} />
      <LibraryTable />
    </div>
  )
}
