import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { Users, Plus, X, Loader2, Pencil, Trash2, ChevronRight, Sparkles, AlertTriangle } from 'lucide-react'
import { listPeople, createPerson, updatePerson, deletePerson, getPersonBrief } from '../lib/api'
import type { Person, PersonBrief } from '../lib/types'

const RELATIONSHIP_COLORS: Record<string, string> = {
  friend:       'bg-blue-900/50 text-blue-300 border border-blue-700/50',
  family:       'bg-amber-900/50 text-amber-300 border border-amber-700/50',
  colleague:    'bg-sky-900/50 text-sky-300 border border-sky-700/50',
  mentor:       'bg-purple-900/50 text-purple-300 border border-purple-700/50',
  romantic:     'bg-pink-900/50 text-pink-300 border border-pink-700/50',
  acquaintance: 'bg-gray-700/50 text-gray-300 border border-gray-600/50',
}

const RELATIONSHIP_TYPES = ['friend', 'family', 'colleague', 'mentor', 'romantic', 'acquaintance']

function getRelColor(type: string) {
  return RELATIONSHIP_COLORS[type] ?? 'bg-gray-700/50 text-gray-300 border border-gray-600/50'
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

// ── Shared form fields ────────────────────────────────────────────────────────

interface PersonFormState {
  name: string
  relationship_type: string
  birthday: string
  notes: string
}

function PersonFormFields({ form, onChange }: { form: PersonFormState; onChange: (f: PersonFormState) => void }) {
  return (
    <>
      <div>
        <label className="block text-sm text-soul-ivory-dim mb-1.5">Name *</label>
        <input
          type="text"
          className="input-soul"
          placeholder="Full name"
          value={form.name}
          onChange={e => onChange({ ...form, name: e.target.value })}
          required
        />
      </div>
      <div>
        <label className="block text-sm text-soul-ivory-dim mb-1.5">Relationship</label>
        <select
          className="input-soul appearance-none"
          value={form.relationship_type}
          onChange={e => onChange({ ...form, relationship_type: e.target.value })}
        >
          {RELATIONSHIP_TYPES.map(t => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm text-soul-ivory-dim mb-1.5">Birthday (optional)</label>
        <input
          type="date"
          className="input-soul"
          value={form.birthday}
          onChange={e => onChange({ ...form, birthday: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-sm text-soul-ivory-dim mb-1.5">Notes (optional)</label>
        <textarea
          className="input-soul resize-none min-h-[80px]"
          placeholder="How do you know this person?"
          value={form.notes}
          onChange={e => onChange({ ...form, notes: e.target.value })}
        />
      </div>
    </>
  )
}

// ── Add Person Modal ──────────────────────────────────────────────────────────

function AddPersonModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<PersonFormState>({ name: '', relationship_type: 'friend', birthday: '', notes: '' })

  const mutation = useMutation({
    mutationFn: () => createPerson({
      name: form.name.trim(),
      relationship_type: form.relationship_type,
      birthday: form.birthday || undefined,
      notes: form.notes.trim() || undefined,
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['people'] }); onClose() },
  })

  return (
    <Modal title="Add person" onClose={onClose}>
      <form onSubmit={e => { e.preventDefault(); if (form.name.trim() && !mutation.isPending) mutation.mutate() }} className="space-y-4">
        <PersonFormFields form={form} onChange={setForm} />
        {mutation.isError && <p className="text-rose-400 text-sm">Failed to add — please try again.</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={!form.name.trim() || mutation.isPending} className="btn-gold flex items-center gap-2 disabled:opacity-50">
            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Add person
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Edit Person Modal ─────────────────────────────────────────────────────────

function EditPersonModal({ person, onClose }: { person: Person; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<PersonFormState>({
    name: person.name,
    relationship_type: person.relationship_type,
    birthday: person.birthday ? person.birthday.slice(0, 10) : '',
    notes: person.notes ?? '',
  })

  const mutation = useMutation({
    mutationFn: () => updatePerson(person.id, {
      name: form.name.trim(),
      relationship_type: form.relationship_type,
      birthday: form.birthday || undefined,
      notes: form.notes.trim() || undefined,
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['people'] }); onClose() },
  })

  return (
    <Modal title={`Edit ${person.name}`} onClose={onClose}>
      <form onSubmit={e => { e.preventDefault(); if (form.name.trim() && !mutation.isPending) mutation.mutate() }} className="space-y-4">
        <PersonFormFields form={form} onChange={setForm} />
        {mutation.isError && <p className="text-rose-400 text-sm">Failed to update — please try again.</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={!form.name.trim() || mutation.isPending} className="btn-gold flex items-center gap-2 disabled:opacity-50">
            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Save changes
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────

function DeleteConfirmModal({ person, onClose }: { person: Person; onClose: () => void }) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => deletePerson(person.id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['people'] }); onClose() },
  })

  return (
    <Modal title="Remove person" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 bg-rose-900/20 border border-rose-500/30 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <p className="text-rose-300 text-sm">
            Remove <strong>{person.name}</strong> from your People section? This won't delete journal entries mentioning them.
          </p>
        </div>
        {mutation.isError && <p className="text-rose-400 text-sm">Failed to remove — please try again.</p>}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-medium px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
          >
            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Remove
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ── Generic Modal wrapper ─────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 16 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="card w-full max-w-md space-y-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl text-soul-ivory">{title}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  )
}

// ── Person Brief Panel ────────────────────────────────────────────────────────

function BriefSection({ title, items }: { title: string; items: string[] }) {
  if (!items || items.length === 0) return null
  return (
    <div>
      <h4 className="text-soul-ivory-dim text-xs uppercase tracking-wider mb-2">{title}</h4>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-soul-ivory text-sm leading-relaxed flex gap-2">
            <span className="text-soul-gold mt-1 shrink-0">·</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function PersonBriefPanel({
  person,
  onClose,
  onEdit,
  onDelete,
}: {
  person: Person
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['personBrief', person.id],
    queryFn: () => getPersonBrief(person.id),
  })

  const brief: PersonBrief | null = data?.brief ?? null

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      className="card w-full lg:w-80 lg:flex-shrink-0 lg:self-start lg:sticky lg:top-0 space-y-4 overflow-y-auto max-h-[80vh]"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-soul-gold/20 border border-soul-gold/40 flex items-center justify-center text-soul-gold font-semibold text-sm shrink-0">
            {getInitials(person.name)}
          </div>
          <div>
            <h3 className="font-serif text-soul-ivory font-semibold">{person.name}</h3>
            <span className={`badge ${getRelColor(person.relationship_type)}`}>
              {person.relationship_type}
            </span>
          </div>
        </div>
        <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg shrink-0"><X className="w-4 h-4" /></button>
      </div>

      {/* Meta */}
      <div className="space-y-1 text-sm">
        {person.birthday && (
          <p className="text-soul-ivory-dim">
            Birthday: <span className="text-soul-ivory">{format(parseISO(person.birthday), 'MMMM d, yyyy')}</span>
          </p>
        )}
        {person.last_interaction && (
          <p className="text-soul-ivory-dim">
            Last seen: <span className="text-soul-ivory">{format(parseISO(person.last_interaction), 'MMM d, yyyy')}</span>
          </p>
        )}
        {person.notes && <p className="text-soul-ivory-dim text-sm italic">{person.notes}</p>}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={onEdit} className="flex items-center gap-1.5 text-sm btn-ghost flex-1 justify-center">
          <Pencil className="w-3.5 h-3.5" /> Edit
        </button>
        <button onClick={onDelete} className="flex items-center gap-1.5 text-sm text-soul-ivory-dim hover:text-rose-400 hover:bg-rose-900/10 px-3 py-2 rounded-xl transition-colors flex-1 justify-center">
          <Trash2 className="w-3.5 h-3.5" /> Remove
        </button>
      </div>

      <div className="border-t border-soul-border" />

      {/* Brief content */}
      {isLoading && (
        <div className="flex items-center gap-2 text-soul-ivory-dim text-sm py-2">
          <Loader2 className="w-4 h-4 animate-spin text-soul-gold" />
          <span>Generating summary…</span>
        </div>
      )}

      {brief && (
        <div className="space-y-4">
          {brief.relationship_summary && (
            <p className="text-soul-ivory text-sm leading-relaxed">{brief.relationship_summary}</p>
          )}
          <BriefSection title="Key facts" items={brief.key_facts} />
          <BriefSection title="Memorable moments" items={brief.memorable_moments} />
          {brief.last_mentioned && (
            <div>
              <h4 className="text-soul-ivory-dim text-xs uppercase tracking-wider mb-1.5">Last mentioned</h4>
              <p className="text-soul-ivory text-sm leading-relaxed italic">"{brief.last_mentioned}"</p>
            </div>
          )}
          <BriefSection title="Upcoming events" items={brief.upcoming_events} />
          {brief.suggested_topics && brief.suggested_topics.length > 0 && (
            <div>
              <h4 className="text-soul-ivory-dim text-xs uppercase tracking-wider mb-2">
                <Sparkles className="w-3 h-3 inline mr-1 text-soul-gold" />
                Talk about next time
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {brief.suggested_topics.map((t, i) => (
                  <span key={i} className="badge bg-soul-gold/10 text-soul-gold border border-soul-gold/20 text-xs">{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}

// ── Person Card ───────────────────────────────────────────────────────────────

function PersonCard({
  person,
  selected,
  onSelect,
  onEdit,
  onDelete,
}: {
  person: Person
  selected: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`card relative group cursor-pointer space-y-3 transition-all ${
        selected ? 'border-soul-gold/60 bg-soul-gold/5' : 'hover:border-soul-gold/30'
      }`}
      onClick={onSelect}
    >
      {/* Edit + Delete — appear on hover */}
      <div
        className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onEdit}
          className="p-1.5 rounded-lg text-soul-ivory-dim hover:text-soul-gold hover:bg-soul-gold/10 transition-colors"
          title="Edit"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg text-soul-ivory-dim hover:text-rose-400 hover:bg-rose-900/20 transition-colors"
          title="Remove"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-3 pr-14">
        <div className="w-10 h-10 rounded-full bg-soul-gold/20 border border-soul-gold/40 flex items-center justify-center text-soul-gold font-semibold text-sm shrink-0">
          {getInitials(person.name)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-soul-ivory truncate">{person.name}</h3>
          <span className={`badge ${getRelColor(person.relationship_type)}`}>
            {person.relationship_type}
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-soul-ivory-dim shrink-0" />
      </div>

      {person.birthday && (
        <p className="text-soul-ivory-dim text-xs">
          🎂 {format(parseISO(person.birthday), 'MMM d, yyyy')}
        </p>
      )}
      {person.last_interaction && (
        <p className="text-soul-ivory-dim text-xs">
          Last seen {format(parseISO(person.last_interaction), 'MMM d, yyyy')}
        </p>
      )}
    </motion.div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function People() {
  const [modal, setModal] = useState<null | 'add' | 'edit' | 'delete'>(null)
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [actionPerson, setActionPerson] = useState<Person | null>(null)

  const { data: people = [], isLoading } = useQuery({
    queryKey: ['people'],
    queryFn: listPeople,
  })

  const openEdit = (p: Person, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setActionPerson(p)
    setModal('edit')
  }

  const openDelete = (p: Person, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setActionPerson(p)
    setModal('delete')
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-soul-gold" />
          <h1 className="font-serif text-2xl text-soul-ivory">People</h1>
          {!isLoading && (
            <span className="text-soul-ivory-dim text-sm">· {people.length} in your world</span>
          )}
        </div>
        <button onClick={() => setModal('add')} className="btn-gold flex items-center gap-2">
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
            <div className="card text-center py-16 space-y-3">
              <Users className="w-8 h-8 text-soul-gold mx-auto opacity-40" />
              <p className="text-soul-ivory-dim">No people yet.</p>
              <p className="text-soul-ivory-dim text-sm">
                Add someone manually, or just mention people in your journal entries — they'll appear here automatically.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {people.map(person => (
              <PersonCard
                key={person.id}
                person={person}
                selected={selectedPerson?.id === person.id}
                onSelect={() => setSelectedPerson(prev => prev?.id === person.id ? null : person)}
                onEdit={() => openEdit(person)}
                onDelete={() => openDelete(person)}
              />
            ))}
          </div>
        </div>

        {/* Brief side panel */}
        <AnimatePresence mode="wait">
          {selectedPerson && (
            <PersonBriefPanel
              key={selectedPerson.id}
              person={selectedPerson}
              onClose={() => setSelectedPerson(null)}
              onEdit={() => openEdit(selectedPerson)}
              onDelete={() => openDelete(selectedPerson)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modal === 'add'    && <AddPersonModal onClose={() => setModal(null)} />}
        {modal === 'edit'   && actionPerson && (
          <EditPersonModal person={actionPerson} onClose={() => { setModal(null); setActionPerson(null) }} />
        )}
        {modal === 'delete' && actionPerson && (
          <DeleteConfirmModal
            person={actionPerson}
            onClose={() => {
              setModal(null)
              setActionPerson(null)
              if (selectedPerson?.id === actionPerson.id) setSelectedPerson(null)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
