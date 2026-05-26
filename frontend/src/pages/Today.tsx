import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { Feather, Send } from 'lucide-react'
import { createEntry, listEntries } from '../../lib/api'
import type { Entry, EntryType } from '../../lib/types'

const DAILY_PROMPTS = [
  'What stayed with you today?',
  'What did you learn about yourself?',
  'What are you grateful for?',
  'What challenged you?',
  'What made you feel alive?',
  'What do you want to remember?',
  'What are you avoiding?',
]

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

function EntryCard({ entry }: { entry: Entry }) {
  const truncated =
    entry.raw_content.length > 200
      ? entry.raw_content.slice(0, 200) + '…'
      : entry.raw_content

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card space-y-3"
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className={`badge ${ENTRY_TYPE_COLORS[entry.entry_type]}`}>
          {entry.entry_type.replace('_', ' ')}
        </span>
        {entry.emotion && (
          <span className="text-xs text-soul-ivory-dim italic">{entry.emotion}</span>
        )}
        <span className="text-xs text-soul-ivory-dim ml-auto">
          {format(new Date(entry.created_at), 'h:mm a')}
        </span>
      </div>

      <p className="text-soul-ivory text-sm leading-relaxed">{truncated}</p>

      {entry.themes.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {entry.themes.map((theme) => (
            <span
              key={theme}
              className="badge bg-soul-border/60 text-soul-ivory-dim"
            >
              {theme}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  )
}

export default function Today() {
  const [content, setContent] = useState('')
  const queryClient = useQueryClient()

  const dayOfWeek = new Date().getDay()
  const prompt = DAILY_PROMPTS[dayOfWeek]

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['entries'],
    queryFn: () => listEntries({ limit: 20 }),
  })

  const mutation = useMutation({
    mutationFn: (text: string) => createEntry(text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] })
      setContent('')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = content.trim()
    if (!trimmed || mutation.isPending) return
    mutation.mutate(trimmed)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      const trimmed = content.trim()
      if (!trimmed || mutation.isPending) return
      mutation.mutate(trimmed)
    }
  }

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Daily prompt banner */}
      <div className="flex items-center gap-3 px-1">
        <Feather className="w-4 h-4 text-soul-gold flex-shrink-0" />
        <p className="text-soul-ivory-dim text-sm italic">{prompt}</p>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Left: Composer */}
        <div className="flex flex-col gap-4 w-full lg:w-1/2 xl:w-2/5">
          <div className="card flex flex-col gap-4 h-full">
            <h2 className="text-soul-ivory font-serif text-lg">Today's entry</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 flex-1">
              <textarea
                className="input-soul resize-none flex-1 min-h-[220px]"
                placeholder="What's on your mind today?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={mutation.isPending}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-soul-ivory-dim">
                  ⌘ + Enter to submit
                </span>
                <button
                  type="submit"
                  className="btn-gold flex items-center gap-2 disabled:opacity-50"
                  disabled={!content.trim() || mutation.isPending}
                >
                  <Send className="w-4 h-4" />
                  {mutation.isPending ? 'Saving…' : 'Save entry'}
                </button>
              </div>
            </form>

            <AnimatePresence>
              {mutation.isSuccess && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-emerald-400 text-sm text-center"
                >
                  Entry saved successfully
                </motion.p>
              )}
              {mutation.isError && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-rose-400 text-sm text-center"
                >
                  Failed to save — please try again
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Entries list */}
        <div className="flex flex-col gap-4 flex-1 overflow-y-auto min-h-0">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-soul-ivory font-serif text-lg">
              {format(new Date(), 'EEEE, MMMM d')}
            </h2>
            <span className="text-soul-ivory-dim text-sm">{entries.length} entries</span>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-soul-gold border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!isLoading && entries.length === 0 && (
            <div className="card text-center py-12">
              <Feather className="w-8 h-8 text-soul-gold mx-auto mb-3 opacity-50" />
              <p className="text-soul-ivory-dim">No entries yet today.</p>
              <p className="text-soul-ivory-dim text-sm mt-1">
                Write your first thought on the left.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <AnimatePresence mode="popLayout">
              {entries.map((entry) => (
                <EntryCard key={entry.id} entry={entry} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
