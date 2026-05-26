import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { Users, Plus, X, ChevronRight, Loader2 } from 'lucide-react'
import { listPeople, createPerson, getPersonBrief } from '../lib/api'
import type { Person } from '../lib/types'

const RELATIONSHIP_COLORS: Record<string, string> = {
  friend: 'bg-blue-900/50 text-blue-300 border border-blue-700/50',
  family: 'bg-amber-900/50 text-amber-300 border border-amber-700/50',
  colleague: 'bg-sky-900/50 text-sky-300 border border-sky-700/50',
  mentor: 'bg-purple-900/50 text-purple-300 border border-purple-700/50',
  romantic: 'bg-pink-900/50 text-pink-300 border border-pink-700/50',
  acquaintance: 'bg-gray-700/50 text-gray-300 border border-gray-600/50',
}

const RELATIONSHIP_TYPES = ['friend', 'family', 'colleague', 'mentor', 'romantic', 'acquaintance']

function getRelationshipColor(type: string) {
  return RELATIONSHIP_COLORS[type] ?? 'bg-gray-700/50 text-gray-300 border border-gray-600/50'
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

// ── Add Person Modal ─────────────────────────────────────────────────────────

interface AddPersonModalProps {
  onClose: () => void
}

function AddPersonModal({ onClose }: AddPersonModalProps) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    name: '',
    relationship_type: 'friend',
    birthday: '',
    notes: '',
  })

  const mutation = useMutation({
    mutationFn: () =>
      createPerson({
        name: form.name.trim(),
        relationship_type: form.relationship_type,
        birthday: form.birthday || undefined,
        notes: form.notes.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] })
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || mutation.isPending) return
    mutation.mutate()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 16 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="card w-full max-w-md space-y-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl text-soul-ivory">Add person</h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-soul-ivory-dim mb-1.5">Name *</label>
            <input
              type="text"
              className="input-soul"
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="block text-sm text-soul-ivory-dim mb-1.5">
              Relationship type
            </label>
            <select
              className="input-soul appearance-none"
              value={form.relationship_type}
              onChange={(e) => setForm((f) => ({ ...f, relationship_type: e.target.value }))}
            >
              {RELATIONSHIP_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-soul-ivory-dim mb-1.5">
              Birthday (optional)
            </label>
            <input
              type="date"
              className="input-soul"
              value={form.birthday}
              onChange={(e) => setForm((f) => ({ ...f, birthday: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm text-soul-ivory-dim mb-1.5">
              Notes (optional)
            </label>
            <textarea
              className="input-soul resize-none min-h-[80px]"
              placeholder="How do you know this person?"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>

          {mutation.isError && (
            <p className="text-rose-400 text-sm">Failed to add person — please try again.</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancel
            </button>
            <button
              type="submit"
              className="btn-gold flex items-center gap-2 disabled:opacity-50"
              disabled={!form.name.trim() || mutation.isPending}
            >
              {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Add person
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

// ── Person Brief Panel ────────────────────────────────────────────────────────

function PersonBriefPanel({ person, onClose }: { person: Person; onClose: () => void }) {
  const { data: brief, isLoading } = useQuery({
    queryKey: ['personBrief', person.id],
    queryFn: () => getPersonBrief(person.id),
  })

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      className="card w-full lg:w-80 lg:flex-shrink-0 lg:self-start lg:sticky lg:top-0 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-soul-gold/20 border border-soul-gold/40 flex items-center justify-center text-soul-gold font-medium text-sm">
            {getInitials(person.name)}
          </div>
          <div>
            <h3 className="font-serif text-soul-ivory">{person.name}</h3>
            <span className={`badge ${getRelationshipColor(person.relationship_type)}`}>
              {person.relationship_type}
            </span>
          </div>
        </div>
        <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
          <X className="w-4 h-4" />
        </button>
      </div>

      {person.birthday && (
        <p className="text-soul-ivory-dim text-sm">
          Birthday:{' '}
          <span className="text-soul-ivory">
            {format(parseISO(person.birthday), 'MMMM d, yyyy')}
          </span>
        </p>
      )}

      {person.last_interaction && (
        <p className="text-soul-ivory-dim text-sm">
          Last interaction:{' '}
          <span className="text-soul-ivory">
            {format(parseISO(person.last_interaction), 'MMM d, yyyy')}
          </span>
        </p>
      )}

      {person.notes && (
        <p className="text-soul-ivory-dim text-sm leading-relaxed">{person.notes}</p>
      )}

      <div className="border-t border-soul-border pt-3">
        {isLoading && (
          <div className="flex items-center gap-2 text-soul-ivory-dim text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading brief…
          </div>
        )}
        {brief && (
          <div className="space-y-2">
            <h4 className="text-soul-ivory-dim text-xs uppercase tracking-wider">Summary</h4>
            <p className="text-soul-ivory text-sm leading-relaxed">
              {typeof brief === 'string' ? brief : JSON.stringify(brief)}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ── Person Card ───────────────────────────────────────────────────────────────

function PersonCard({
  person,
  onClick,
  selected,
}: {
  person: Person
  onClick: () => void
  selected: boolean
}) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`card text-left w-full space-y-3 transition-colors ${
        selected ? 'border-soul-gold/60' : 'hover:border-soul-gold/30'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-soul-gold/20 border border-soul-gold/40 flex items-center justify-center text-soul-gold font-medium text-sm flex-shrink-0">
          {getInitials(person.name)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-soul-ivory truncate">{person.name}</h3>
          <span className={`badge ${getRelationshipColor(person.relationship_type)}`}>
            {person.relationship_type}
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-soul-ivory-dim flex-shrink-0" />
      </div>

      {person.birthday && (
        <p className="text-soul-ivory-dim text-xs">
          Birthday: {format(parseISO(person.birthday), 'MMM d, yyyy')}
        </p>
      )}

      {person.last_interaction && (
        <p className="text-soul-ivory-dim text-xs">
          Last seen: {format(parseISO(person.last_interaction), 'MMM d, yyyy')}
        </p>
      )}
    </motion.button>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function People() {
  const [showModal, setShowModal] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)

  const { data: people = [], isLoading } = useQuery({
    queryKey: ['people'],
    queryFn: listPeople,
  })

  const handleSelectPerson = (person: Person) => {
    setSelectedPerson((prev) => (prev?.id === person.id ? null : person))
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-soul-gold" />
          <h1 className="font-serif text-2xl text-soul-ivory">People</h1>
          <span className="text-soul-ivory-dim text-sm">· {people.length} in your world</span>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-gold flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add person
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Grid */}
        <div className="flex-1 min-w-0">
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-soul-gold border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!isLoading && people.length === 0 && (
            <div className="card text-center py-16">
              <Users className="w-8 h-8 text-soul-gold mx-auto mb-3 opacity-40" />
              <p className="text-soul-ivory-dim">No people added yet.</p>
              <p className="text-soul-ivory-dim text-sm mt-1">
                Add the people who matter to you.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {people.map((person) => (
              <PersonCard
                key={person.id}
                person={person}
                onClick={() => handleSelectPerson(person)}
                selected={selectedPerson?.id === person.id}
              />
            ))}
          </div>
        </div>

        {/* Side panel */}
        <AnimatePresence mode="wait">
          {selectedPerson && (
            <PersonBriefPanel
              key={selectedPerson.id}
              person={selectedPerson}
              onClose={() => setSelectedPerson(null)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && <AddPersonModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </div>
  )
}
