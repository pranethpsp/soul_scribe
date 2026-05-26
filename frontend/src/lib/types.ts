export interface AuthUser {
  id: string
  username: string
  display_name: string
  created_at?: string
}

export type EntryType =
  | 'thought'
  | 'memory'
  | 'lesson'
  | 'idea'
  | 'event'
  | 'person_note'
  | 'milestone'
  | 'emotion_log'

export type RelationshipType =
  | 'friend'
  | 'family'
  | 'colleague'
  | 'mentor'
  | 'romantic'
  | 'acquaintance'

export interface Entry {
  id: string
  raw_content: string
  entry_type: EntryType
  emotion: string
  emotional_weight: number
  themes: string[]
  people_mentioned: string[]
  life_relevance_score: number
  key_insight: string | null
  created_at: string
  pii_cleared: boolean
}

export interface Pattern {
  id: string
  pattern_type: string
  description: string
  confidence: number
  detected_at: string
}

export interface Person {
  id: string
  name: string
  relationship_type: RelationshipType
  birthday: string | null
  notes: string | null
  last_interaction: string | null
}

export interface PersonBrief {
  name: string
  relationship_summary: string
  key_facts: string[]
  memorable_moments: string[]
  upcoming_events: string[]
  last_mentioned: string
  suggested_topics: string[]
}

export interface InsightItem {
  type: 'upcoming_event' | 'pattern' | 'memory_anniversary' | 'dormant_connection' | 'recurring_idea'
  title: string
  description: string
  action_hint?: string
  metadata?: Record<string, unknown>
}

export interface ConfidenceReport {
  personal_evidence_score: number
  theory_alignment_score: number
  cross_consistency_score: number
  temporal_relevance_score: number
  source_citation_rate: number
  overall_confidence: number
  threshold_met: boolean
  entries_used: number
  theories_used: number
  entries_ids: string[]
  theory_ids: string[]
}

export interface SourceCitation {
  source_type: 'entry' | 'theory'
  source_id: string
  title: string
  excerpt: string
  date?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  confidence?: ConfidenceReport
  citations?: SourceCitation[]
  is_disclaimer?: boolean
  entry_result?: {
    entry_type: EntryType
    emotion: string
    themes: string[]
    key_insight: string | null
  }
}
