# SOULSCRIBE — Your Lifelong Intelligent Companion

> *"It remembers everything you lived. It understands everything you felt. It guides every decision you face — with the wisdom of your own life and the knowledge of the greatest minds in history."*

---

## App Name Suggestions (pick one)

| Name | Meaning | Vibe |
|---|---|---|
| **SOULSCRIBE** | Writes the story of your soul | Deep, personal, literary |
| **AURA** | Your personal life intelligence layer | Mystical, modern, elegant |
| **CHRONICLE** | Your life, remembered and understood | Clear, timeless, powerful |
| **ANIMA** | Jung's concept of the inner self | Philosophical, psychological |
| **LUMINARY** | Light cast on your past to guide your future | Inspiring, warm |
| **VERITY** | Truth extracted from your own lived experience | Honest, grounding |

---

## Vision

Most people forget 90% of their life. The 10% they remember is distorted by recency and emotion. SOULSCRIBE is not a diary — it is your **lifelong intelligence layer**.

Every random thought, birthday, life lesson, business idea, heartbreak, triumph, and quiet realization you feed it becomes part of a growing, living understanding of who you are. When you face a hard decision, SOULSCRIBE reasons at two levels simultaneously:

1. **Your personal history** — patterns, fears, values, past decisions and their outcomes
2. **Universal wisdom** — psychology, philosophy, behavioral science, and great thinkers curated by the developer into a private Knowledge Vault

It synthesizes both, measures its own confidence before speaking, and only answers strongly when it has earned the right to. When it doesn't know enough, it tells you the truth.

It is your personal astrologer, memory, soulmate, and godfather — backed by science.

---

## What Users Actually Do

### Input — anything, any time, any format
```
"Today I felt completely lost at work. I keep wondering if I chose the wrong career."

"Mia's birthday is March 14. She loves sunflowers and hates being called late."

"Business idea: subscription box for people learning new languages — curated books, flashcards, cultural snacks."

"Life lesson from today: never make big decisions when you're hungry or tired."

"I had coffee with dad. He told me the story of how he almost gave up his business in 1998 but didn't.
 Reminded me that every hard phase passes."

"Today I ran 5km without stopping for the first time. Small thing but it felt massive."
```

### Recall — weeks, months, years later
```
"What were my thoughts about quitting my job last year?"
"Have I made this mistake before — jumping in without planning?"
"What business ideas have I had in the last 6 months?"
"Looking back, what are my biggest patterns when I'm anxious?"
"What have been the best moments of my life in the last 2 years?"
```

### Decision Support — the godfather + scientist moment
```
User: "I'm thinking of quitting my job and starting a business. What do you think?"

──────────────────────────────────────────────────
CONFIDENCE REPORT
──────────────────────────────────────────────────
Personal Evidence       ████████████████░░  88%
Theory Alignment        ███████████████░░░  84%
Cross-Consistency       █████████████████░  91%
Temporal Relevance      ██████████████░░░░  79%
Source Citation Rate    ████████████████░░  86%
──────────────────────────────────────────────────
OVERALL CONFIDENCE                          86% ✓
Sources: 11 personal entries · 4 theories
──────────────────────────────────────────────────

Based on 11 entries from the last 14 months and Viktor Frankl's logotherapy,
Maslow's hierarchy, and Daniel Kahneman's decision theory:

You've mentioned feeling trapped at work 11 times. The first was March 2024 —
long before this felt urgent. That's not impulsiveness. That's a slow-building truth.

In August you wrote: "I keep thinking if I don't try now, I never will."

Frankl argues that meaning-driven decisions sustain better than security-driven ones.
Your father's story moved you deeply. You wrote: "I want to be that person who stayed
the course." That's a value, not a passing thought.

Your business idea — the language-learning subscription — has appeared twice, 5 months
apart, unprompted. Kahneman calls this "System 2 persistence" — slow, recurring ideas
are more reliable signals than excited impulses.

Your historical pattern in hard decisions: you delay, doubt, then leap — and afterward
you consistently write that you regret waiting, not acting. Six times.

What your life and science agree on: build 3 months of financial runway first.
Then go. The evidence is clear. You already know this.
```

### When confidence is too low — radical honesty
```
User: "Will I be happy if I move to a new city?"

──────────────────────────────────────────────────
CONFIDENCE REPORT
──────────────────────────────────────────────────
Personal Evidence       ████████░░░░░░░░░░  47%
Theory Alignment        ██████████░░░░░░░░  55%
Cross-Consistency       ██████░░░░░░░░░░░░  38%
Temporal Relevance      ████████░░░░░░░░░░  44%
Source Citation Rate    ██████████░░░░░░░░  58%
──────────────────────────────────────────────────
OVERALL CONFIDENCE                          48% ✗
──────────────────────────────────────────────────

I need to be honest with you — I don't have enough to answer this confidently.

You've only written about this once, and your entries about location and belonging
point in different directions. Research on happiness and relocation is itself
inconclusive — hedonic adaptation means novelty fades regardless of where you live.

What I can say with confidence (48% is still real):
→ Your last 3 entries show you're restless, not unhappy with your current city.
→ Restlessness rarely resolves with geography alone.

What I genuinely don't know: whether this city is the constraint or something else.
Write more about what specifically feels limiting. Ask me again in 3 months.
```

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           SOULSCRIBE                                    │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    React Frontend                                │   │
│  │                                                                  │   │
│  │   [Today] [Oracle] [Timeline] [People] [Ideas] [Patterns]        │   │
│  │                              [Admin ─ developer only]            │   │
│  └──────────────────────────┬───────────────────────────────────────┘  │
│                             │ REST + WebSocket                          │
│  ┌──────────────────────────▼───────────────────────────────────────┐  │
│  │                      FastAPI Backend                              │  │
│  │                                                                   │  │
│  │  ┌────────────────────────────────────────────────────────────┐  │  │
│  │  │              Orchestrator Agent (Pydantic AI)               │  │  │
│  │  │                                                             │  │  │
│  │  │  USER-FACING AGENTS                                         │  │  │
│  │  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │  │  │
│  │  │  │   Journal   │ │   Oracle    │ │   Pattern   │          │  │  │
│  │  │  │Intelligence │ │   Agent     │ │   Agent     │          │  │  │
│  │  │  └─────────────┘ └──────┬──────┘ └─────────────┘          │  │  │
│  │  │  ┌─────────────┐        │        ┌─────────────┐          │  │  │
│  │  │  │   Memory    │        │        │  Decision   │          │  │  │
│  │  │  │   Curator   │        │        │   Coach     │          │  │  │
│  │  │  └─────────────┘        │        └──────┬──────┘          │  │  │
│  │  │                         │               │                  │  │  │
│  │  │  ┌──────────────────────▼───────────────▼──────────────┐  │  │  │
│  │  │  │              Confidence Scorer                        │  │  │  │
│  │  │  │  PES · TAS · CCS · TRS · SCR → Overall Score         │  │  │  │
│  │  │  │  Gate: ≥80% → answer  |  <80% → honest disclaimer    │  │  │  │
│  │  │  └───────────────────────────────────────────────────────┘  │  │  │
│  │  │                                                             │  │  │
│  │  │  SYSTEM AGENTS                                              │  │  │
│  │  │  ┌─────────────┐ ┌──────────────────────────────────────┐  │  │  │
│  │  │  │PII Guardian │ │  Knowledge Vault Agent (DEV ONLY)    │  │  │  │
│  │  │  │(Guardrail)  │ │  Ingests books, theories, research   │  │  │  │
│  │  │  └─────────────┘ └──────────────────────────────────────┘  │  │  │
│  │  └────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────────┐   │
│  │   PostgreSQL     │  │      Milvus       │  │     Langfuse       │   │
│  │  Structured data │  │   Vector Store    │  │  LLM Observability │   │
│  │  User entries    │  │  user_entries     │  │  Prompt traces     │   │
│  │  People/Events   │  │  knowledge_vault  │  │  Quality scoring   │   │
│  │  Confidence logs │  │  person_profiles  │  │  Cost tracking     │   │
│  │  Knowledge index │  │  pattern_store    │  │  A/B prompt tests  │   │
│  └──────────────────┘  └──────────────────┘  └────────────────────┘   │
│                                                                         │
│  ┌──────────────────┐  ┌──────────────────┐                            │
│  │  OpenTelemetry   │  │   MCP Server     │                            │
│  │  Infra traces    │  │  Expose to other │                            │
│  │  → Jaeger        │  │  tools/agents    │                            │
│  └──────────────────┘  └──────────────────┘                            │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Two-Layer Knowledge System

This is the core innovation. Every critical answer draws from two distinct knowledge pools:

```
Question
   │
   ├──► LAYER 1: Personal Memory (Milvus: user_entries)
   │    Your actual diary entries, thoughts, patterns, history
   │    "What YOUR life says about this"
   │
   └──► LAYER 2: Universal Wisdom (Milvus: knowledge_vault)
        Psychological theories, books, behavioral science
        "What SCIENCE and great thinkers say about this"
        (Fed by developer — never touched by user)
        │
        ▼
   Confidence Scorer evaluates both layers
        │
   ≥ 80% → Strong, confident, sourced answer
   < 80% → Honest, transparent, partial answer
```

---

## Agent System (8 Agents — Pydantic AI)

### Agent 1: Orchestrator
Routes every input. Decides which agents activate and in what order. For decision questions: always runs Oracle + Knowledge Vault retrieval + Confidence Scorer before responding.

---

### Agent 2: Journal Intelligence Agent
Transforms raw human input into structured, searchable memory.

**Extracts:** entities, people, emotion, themes, entry type, life relevance score
**Writes to:** PostgreSQL (structured) + Milvus (embedding)
**Always calls:** PII Guardian before any write

```python
Entry types: thought | memory | lesson | idea | event | person_note | milestone | emotion_log
```

---

### Agent 3: Oracle Agent
The soulmate. Answers questions about the user's life grounded entirely in retrieved entries.

**Flow:**
1. Semantic search in Milvus (user_entries collection)
2. Retrieves psychology profile from PostgreSQL
3. Calls Wisdom Retriever to get relevant theories from knowledge_vault
4. Passes all context to Confidence Scorer
5. If score ≥ 80%: generates grounded, cited answer
6. If score < 80%: generates honest "here is what I know and don't know" response

**Hallucination rule:** Every factual claim must cite a source — either a specific entry (`"You wrote on Aug 3..."`) or a specific theory (`"Frankl's logotherapy suggests..."`). Zero unsourced assertions allowed.

---

### Agent 4: Pattern Agent
The analyst. Finds behavioral, emotional, cognitive patterns across the user's entire history.

**Detects:**
- Emotional cycles (recurring low/high patterns)
- Trigger patterns (what precedes anxiety, confidence, inspiration)
- Decision patterns (how the user historically makes choices + outcomes)
- Idea recurrence (business ideas that reappear unprompted)
- Growth arcs (evolution of beliefs over time)

**Outputs:** Updates `psychology_profiles` table continuously. This profile feeds Oracle and Decision Coach.

---

### Agent 5: Memory Curator Agent
The librarian. Manages retrieval, people data, upcoming events.

**Handles:**
- Person-specific recall: "Everything about Mia"
- Upcoming birthday/anniversary alerts
- Memory consolidation: groups related entries into life "chapters"
- Deduplication of similar entries
- Temporal indexing: "this day last year"

---

### Agent 6: Decision Coach Agent
The godfather. Activated only for decision-type questions.

**Flow:**
1. Extracts the decision domain (career | relationship | money | health | location | creative)
2. Retrieves: past decisions in same domain + user-recorded outcomes
3. Retrieves: psychology profile (values, fear patterns, decision style)
4. Calls Wisdom Retriever for domain-specific universal theories
5. Passes everything to Confidence Scorer
6. Synthesizes advice that explicitly connects personal history to theory

**Key principle:** Never gives generic advice. Every suggestion is traceable to either a specific entry or a specific theory.

---

### Agent 7: PII Guardian (Always-On Guardrail)
Runs as a pipeline step before EVERY write operation.

| PII Type | Action |
|---|---|
| Phone, email, address | Redact → `[CONTACT_INFO]` |
| Specific financial figures | Redact unless user explicitly tags |
| Medical info about others | Vault (encrypted, excluded from search) |
| Third-party private confessions | Flag `shared_in_confidence: true` — never surfaced publicly |
| Passwords, credentials | Hard block — not stored under any condition |

---

### Agent 8: Knowledge Vault Agent (Developer-Only)
The scholar. Managed exclusively by the developer. Users never interact with it directly.

**What the developer feeds it:**
- Psychological theories (Jung, Maslow, Erikson, attachment theory, CBT, ACT)
- Books (Man's Search for Meaning, Thinking Fast and Slow, Atomic Habits, Meditations)
- Behavioral science research (Kahneman, Cialdini, Ariely)
- Philosophy (Stoicism, Existentialism, Eastern philosophy)
- Neuroscience (decision-making, habit formation, emotional regulation)
- Any domain the developer wants to add over time

**How it works:**
1. Developer uploads PDF / pastes text via Admin Panel
2. Agent chunks the content intelligently (by concept, not page)
3. Generates embeddings → stores in Milvus `knowledge_vault` collection
4. Indexes source metadata in PostgreSQL `knowledge_sources` table
5. Content is now available to Oracle + Decision Coach via Wisdom Retriever

**Admin Panel features:**
- Upload PDF or paste raw text
- Tag: author, domain, theory name, year
- View vault contents + usage stats (which theories get cited most)
- Deactivate/remove sources
- See retrieval hit rate per source

---

## Confidence Scoring System

Every Oracle and Decision Coach response is scored before being shown to the user. If the score is below 80%, the system explicitly discloses its uncertainty.

### Five Metrics

**1. Personal Evidence Score (PES) — 30% weight**
Measures how much personal history supports the answer.
```
- Number of relevant entries retrieved (semantic similarity > 0.75)
- Consistency: do entries point in the same direction or contradict each other?
- Density: entries spread over time vs. all from one week
- Depth: entries with high emotional weight count more
```

**2. Theory Alignment Score (TAS) — 25% weight**
Measures how well universal theories apply to the question.
```
- Number of relevant theories retrieved from knowledge_vault
- Average semantic similarity score from Milvus retrieval
- Inter-theory agreement: do multiple theories converge on the same answer?
- Theory recency: older, well-established theories score higher (less speculative)
```

**3. Cross-Consistency Score (CCS) — 20% weight**
Measures agreement between personal history and universal theories.
```
- If personal entries and theories agree → high score
- If they conflict (you historically do X but theory says do Y) → lower score
  but also explicitly surfaced as a tension for the user
- Complete agreement = 100, complete contradiction = 20 (not 0 — contradiction is itself insight)
```

**4. Temporal Relevance Score (TRS) — 15% weight**
Measures how recent the personal evidence is.
```
- Entries from last 30 days: full weight
- 30-90 days: 85% weight
- 90-365 days: 65% weight
- >1 year: 40% weight
- Recency-weighted average across all retrieved entries
```

**5. Source Citation Rate (SCR) — 10% weight**
Anti-hallucination metric. Measures how much of the answer is verifiably sourced.
```
- Every factual claim must map to a retrieved chunk (entry or theory)
- Claims without a source pointer are penalized
- Measured post-generation by a verification pass
- Target: >90% of claims sourced
```

### Overall Formula
```python
confidence = (
    0.30 * personal_evidence_score   +
    0.25 * theory_alignment_score    +
    0.20 * cross_consistency_score   +
    0.15 * temporal_relevance_score  +
    0.10 * source_citation_rate
)
```

### Response Gates
```
≥ 80%  → Full confident answer with sourced reasoning
60–79% → Answer with explicit caveats: "Here is what I see, but it's incomplete because..."
< 60%  → Honest disclosure: "I don't have enough to answer this well. Here is what I do know..."
```

### Confidence UI — shown before every Oracle answer
```
──────────────────────────────────────────────────
CONFIDENCE REPORT
──────────────────────────────────────────────────
Personal Evidence       ████████████████░░  86%  (9 entries, consistent)
Theory Alignment        ███████████████░░░  82%  (Frankl, Kahneman, Maslow)
Cross-Consistency       █████████████████░  89%  (history + theory agree)
Temporal Relevance      ██████████████░░░░  76%  (entries span 14 months)
Source Citation Rate    ████████████████░░  88%  (all claims sourced)
──────────────────────────────────────────────────
OVERALL CONFIDENCE                          84% ✓
Sources: 9 personal entries · 3 theories
──────────────────────────────────────────────────
```

---

## Database Design

### Why PostgreSQL + Milvus — No SQLite

| Need | PostgreSQL | Milvus |
|---|---|---|
| Structured queries, joins, ACID | ✅ Primary | ❌ |
| Vector similarity search (RAG) | ❌ | ✅ Primary |
| Confidence scores, audit logs | ✅ | ❌ |
| "Find entries semantically similar to this question" | ❌ | ✅ |
| Knowledge source metadata | ✅ | ❌ |
| Chunk embeddings for RAG | ❌ | ✅ |

SQLite excluded entirely. Both databases serve distinct, non-overlapping roles.

---

### PostgreSQL Schema

```sql
-- Users
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  timezone    VARCHAR(50),
  display_name VARCHAR(100)
);

-- Psychology profile — built continuously by Pattern Agent
CREATE TABLE psychology_profiles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES users(id),
  core_values       JSONB,        -- ["freedom", "family", "growth"]
  fear_patterns     JSONB,        -- ["failure", "abandonment"]
  decision_style    VARCHAR(50),  -- "deliberate_then_bold"
  emotional_baseline VARCHAR(50),
  recurring_themes  JSONB,
  dominant_theories JSONB,        -- which vault theories resonate most with this user
  last_updated      TIMESTAMPTZ
);

-- All diary entries
CREATE TABLE entries (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID REFERENCES users(id),
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  raw_content          TEXT NOT NULL,
  entry_type           VARCHAR(30),     -- thought|memory|lesson|idea|event|person_note|milestone
  emotion              VARCHAR(50),
  emotional_weight     FLOAT,           -- 0.0 to 1.0
  themes               JSONB,
  people_mentioned     JSONB,
  life_relevance_score FLOAT,
  pii_cleared          BOOLEAN DEFAULT FALSE,
  milvus_id            VARCHAR(100),    -- pointer to vector in Milvus
  is_archived          BOOLEAN DEFAULT FALSE
);

-- People in the user's life
CREATE TABLE people (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES users(id),
  name              VARCHAR(100),
  relationship_type VARCHAR(50),   -- friend|family|colleague|mentor
  birthday          DATE,
  notes             TEXT,
  last_interaction  DATE,
  milvus_profile_id VARCHAR(100)
);

-- Important dates and events
CREATE TABLE life_events (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES users(id),
  title               VARCHAR(200),
  event_date          DATE,
  recurs_yearly       BOOLEAN DEFAULT FALSE,
  person_id           UUID REFERENCES people(id),
  reminder_days_before INT DEFAULT 7
);

-- Ideas tracker
CREATE TABLE ideas (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES users(id),
  title             VARCHAR(200),
  description       TEXT,
  first_mentioned   DATE,
  mention_count     INT DEFAULT 1,
  status            VARCHAR(30) DEFAULT 'raw',  -- raw|developing|pursuing|abandoned
  related_entry_ids JSONB
);

-- Patterns detected by Pattern Agent
CREATE TABLE patterns (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES users(id),
  detected_at      TIMESTAMPTZ,
  pattern_type     VARCHAR(50),
  description      TEXT,
  evidence_entries JSONB,
  confidence       FLOAT
);

-- ── KNOWLEDGE VAULT (developer-managed) ──────────────────────────────
CREATE TABLE knowledge_sources (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        VARCHAR(300) NOT NULL,
  author       VARCHAR(200),
  domain       VARCHAR(50),      -- psychology|philosophy|science|business|spirituality
  theory_type  VARCHAR(100),     -- cognitive_bias|existential|behavioral|etc
  summary      TEXT,
  added_at     TIMESTAMPTZ DEFAULT NOW(),
  chunk_count  INT,
  retrieval_count INT DEFAULT 0, -- how many times cited in answers
  is_active    BOOLEAN DEFAULT TRUE
);

-- ── CONFIDENCE + METRICS ─────────────────────────────────────────────
CREATE TABLE response_metrics (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id        UUID,
  user_id                UUID REFERENCES users(id),
  query                  TEXT,
  personal_evidence_score FLOAT,
  theory_alignment_score  FLOAT,
  cross_consistency_score FLOAT,
  temporal_relevance_score FLOAT,
  source_citation_rate    FLOAT,
  overall_confidence      FLOAT,
  threshold_met           BOOLEAN,   -- was ≥80% achieved?
  entries_used            INT,
  theories_used           INT,
  entries_ids             JSONB,
  theory_ids              JSONB,
  response_latency_ms     INT,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation history
CREATE TABLE conversations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id),
  started_at TIMESTAMPTZ,
  messages   JSONB,
  topic      VARCHAR(200)
);

-- Learned user preferences
CREATE TABLE preferences (
  user_id    UUID REFERENCES users(id),
  key        VARCHAR(100),
  value      TEXT,
  confidence FLOAT,
  updated_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, key)
);
```

---

### Milvus Collections

```python
# Collection 1: User diary entries (RAG for personal history)
user_entries:
  fields:
    - entry_id:        VARCHAR     # FK to PostgreSQL entries.id
    - user_id:         VARCHAR
    - embedding:       FLOAT_VECTOR(1536)
    - entry_type:      VARCHAR
    - emotion:         VARCHAR
    - emotional_weight: FLOAT
    - created_at:      INT64       # epoch — for temporal filtering

# Collection 2: Knowledge vault (RAG for universal wisdom)
knowledge_vault:
  fields:
    - chunk_id:        VARCHAR     # UUID
    - source_id:       VARCHAR     # FK to knowledge_sources.id
    - title:           VARCHAR     # Book/theory name
    - author:          VARCHAR
    - domain:          VARCHAR     # psychology|philosophy|science
    - embedding:       FLOAT_VECTOR(1536)
    - chunk_text:      VARCHAR     # actual text chunk (for citation)

# Collection 3: Person profiles (semantic search over relationships)
person_profiles:
  fields:
    - person_id:       VARCHAR
    - user_id:         VARCHAR
    - embedding:       FLOAT_VECTOR(1536)
    - relationship_type: VARCHAR

# Collection 4: Detected patterns
pattern_store:
  fields:
    - pattern_id:      VARCHAR
    - user_id:         VARCHAR
    - embedding:       FLOAT_VECTOR(1536)
    - pattern_type:    VARCHAR
```

---

## Langfuse Integration

Langfuse traces every LLM call with full visibility — prompt, response, token count, cost, latency, quality scores. It is the observability layer for everything AI-specific.

```
User Query → Langfuse Trace begins (trace_id generated)
│
├── Orchestrator span
│     └── intent classification LLM call
│
├── Oracle Agent span
│     ├── Milvus: user_entries search span (query, top-k, similarity scores)
│     ├── Milvus: knowledge_vault search span (theories retrieved)
│     ├── Confidence Scorer span (5 metric scores computed)
│     ├── LLM generation span (full prompt with context, response, tokens)
│     └── Source citation verification span
│
├── PII Guardian span
│     └── items detected + actions taken
│
└── Trace ends → Langfuse dashboard shows full tree + cost + quality

```

**What Langfuse tracks:**
- Every prompt + response (for debugging and quality review)
- Token cost per agent, per day, per user
- Latency breakdown per span
- Confidence score distribution over time
- Hallucination rate (claims without sources)
- Which knowledge_vault theories get cited most
- A/B testing of Oracle prompt versions
- User feedback (thumbs up/down on answers → training signal for evals)

**OpenTelemetry handles (separately):**
- HTTP request latency (API endpoints)
- PostgreSQL query time
- Milvus query time
- Docker container health
- Memory and CPU metrics
- → All exported to Jaeger for visualization

---

## Evaluation-Driven Development (Pydantic Evals)

Five evaluation suites. Prove multi-agent + knowledge vault beats a plain chatbot.

### Suite 1: Journal Extraction Accuracy
```
Input:   20 raw diary entries (manually gold-labeled)
Metrics: Precision/recall for entity extraction, emotion detection, theme tagging
Compare: Single GPT prompt vs. Journal Intelligence Agent pipeline
Goal:    F1 > 0.85 on entity extraction
```

### Suite 2: Oracle Answer Quality
```
Input:   15 life questions with gold answers from a synthetic 12-month journal
Metrics:
  - Factual faithfulness: answer only uses retrieved entries (no fabrication)
  - Recall: relevant entries surfaced / total relevant entries
  - Hallucination rate: facts stated not traceable to any entry
Compare: Plain ChatGPT (no RAG) → RAG only → Full Oracle with vault
Goal:    Hallucination rate < 3%, Recall > 80%
```

### Suite 3: Knowledge Vault Uplift
```
Input:   10 decision questions requiring domain knowledge (career, psychology, relationships)
Metrics: Does incorporating vault theories improve answer depth score?
         Human-rated depth: 1–5 scale
Compare: Oracle without vault vs. Oracle with vault
Goal:    +40% depth score improvement with vault active
```

### Suite 4: Confidence Score Calibration
```
Input:   30 Oracle answers with known ground-truth quality ratings
Metrics: Correlation between confidence score and actual answer quality
         If score says 85%, actual quality should cluster around 85%
Goal:    Pearson r > 0.75 (confidence is actually predictive)
```

### Suite 5: PII Guardrail Reliability
```
Input:   30 text samples with known PII (phone, email, financial, sensitive third-party)
Metrics: Recall (nothing leaked), Precision (no over-redaction)
Goal:    100% recall, >95% precision
```

### Expected Results Table (capstone centerpiece)
```
Metric                        | Baseline  | +RAG      | +Vault    | Full System
──────────────────────────────────────────────────────────────────────────────
Hallucination rate            |   34%     |    6%     |    5%     |    1.8%
Relevant entries surfaced     |    —      |   62%     |   64%     |   88%
Answer depth score (1–5)      |   1.8     |   2.9     |   3.6     |   4.7
PII leaked                    |   n/a     |   n/a     |   n/a     |    0%
Confidence calibration (r)    |    —      |    —      |    —      |   0.81
Decision insight coverage     |   18%     |   49%     |   71%     |   88%
```

---

## UI Design (React + TypeScript)

### Design Language
- **Theme:** Deep midnight navy `#0D1117` + warm gold `#D4A853` + ivory text `#F5F0E8`
- **Typography:** Playfair Display (headings — diary warmth) + Inter (body — clarity)
- **Motion:** Framer Motion — entries slide in like journal pages, confidence bars animate up
- **Feel:** Moleskine notebook meets AI. Warm, personal, intelligent — not sterile

### Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  ◆ SOULSCRIBE                                          [You] [⚙]     │
├──────────────┬──────────────────────────────┬───────────────────────┤
│              │                              │                       │
│  Navigation  │      MAIN CONTENT AREA       │   ALWAYS-ON PANEL     │
│              │                              │                       │
│  ◈ Today     │   [view-specific content]    │  ┌─────────────────┐  │
│  ◈ Oracle    │                              │  │ Coming up       │  │
│  ◈ Timeline  │                              │  │ Mia birthday    │  │
│  ◈ People    │                              │  │ in 3 days       │  │
│  ◈ Ideas     │                              │  └─────────────────┘  │
│  ◈ Patterns  │                              │  ┌─────────────────┐  │
│              │                              │  │ Pattern spotted │  │
│  ─ Recent ── │                              │  │ You've felt     │  │
│  Today       │                              │  │ stuck 4× in 6mo │  │
│  Yesterday   │                              │  └─────────────────┘  │
│  3 days ago  │                              │  ┌─────────────────┐  │
│              │                              │  │ This week in    │  │
│  ─ Admin ─── │                              │  │ 2024 you wrote: │  │
│  Vault Mgmt  │                              │  │ "I finally feel │  │
│  (dev only)  │                              │  │  like myself"   │  │
│              │                              │  └─────────────────┘  │
└──────────────┴──────────────────────────────┴───────────────────────┘
```

### Views

**Today (Home)**
- Entry composer — plain text, no friction
- Entry type badge auto-appears after submission
- Flowing timeline of today's entries
- Rotating daily prompt: "What stayed with you today?", "What did you learn about yourself?"

**Oracle (Chat)**
- Full-screen chat, responses stream word by word
- Confidence Report card appears before each answer — animated bars
- Every cited entry expandable inline: `"You wrote on Aug 3, 2024 →"` → entry card opens
- Every cited theory expandable: `"Viktor Frankl, Man's Search for Meaning →"` → theory excerpt
- Conversation history in left drawer

**Timeline**
- Vertical scroll through months and years
- Entry type filter (thoughts, lessons, ideas, milestones)
- Emotion color coding (soft overlays)
- "This day last year" floating badge

**People**
- Card grid — each person has last-interaction indicator and upcoming event badge
- Click → all entries mentioning them, full history, upcoming dates

**Ideas**
- Kanban: Raw → Developing → Pursuing → Archived
- Each card: first-mention date, recurrence count, related entries

**Patterns**
- Visual cards — each pattern has a title, description, confidence %, evidence entries linked
- Psychology profile summary: core values, decision style, top fears — all inferred

**Admin — Knowledge Vault (developer only, gated by env flag)**
- Upload PDF or paste text
- Tag: domain, author, theory name
- Vault contents table: title, chunks, retrieval count, last cited
- Usage stats: which theories appear most in answers
- Deactivate/remove sources

---

## Full Request Flow — Decision Question

```
1. User: "Should I leave my job and start my own company?"

2. Orchestrator:
   → Classifies: decision_question, domain=career
   → Activates: Oracle + Decision Coach + Knowledge Vault retrieval

3. Parallel retrieval:
   ├── Milvus query: user_entries   [semantic: "career, job, business, purpose, risk"]
   │     Returns: 11 entries (similarity > 0.75)
   └── Milvus query: knowledge_vault [semantic: "entrepreneurship, career risk, meaning, decision"]
         Returns: 4 theory chunks
         (Frankl: meaning-driven decisions, Kahneman: System 2 thinking,
          Maslow: self-actualization, Dweck: growth mindset)

4. Confidence Scorer:
   ├── PES:  88%  (11 entries, consistent direction, spread over 14 months)
   ├── TAS:  84%  (4 theories, all point same direction)
   ├── CCS:  91%  (personal history and theories strongly agree)
   ├── TRS:  79%  (entries range from recent to 14 months ago)
   ├── SCR:  86%  (post-generation verification pass)
   └── OVERALL: 86% ✓ — threshold met, full confident answer authorized

5. Decision Coach + Oracle generate answer:
   → Every claim mapped to entry_id or chunk_id before output
   → Confidence report prepended
   → Streamed to frontend

6. Langfuse records full trace:
   → orchestrator span + oracle span + milvus spans + confidence span + LLM span
   → 2,847 input tokens, 512 output tokens, $0.0041
   → Total latency: 2.3s

7. OpenTelemetry records:
   → Milvus user_entries query: 41ms
   → Milvus knowledge_vault query: 38ms
   → PostgreSQL profile fetch: 9ms
   → Total API: 2,290ms

8. PostgreSQL logs:
   → response_metrics row with all 5 scores, entries_used=11, theories_used=4
```

---

## Docker Infrastructure

```yaml
# docker-compose.yml
services:

  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: soulscribe
      POSTGRES_USER: soul
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  milvus-etcd:
    image: quay.io/coreos/etcd:v3.5.5
    environment:
      ETCD_AUTO_COMPACTION_RETENTION: "1"
      ETCD_QUOTA_BACKEND_BYTES: "4294967296"
    volumes:
      - etcd_data:/etcd

  milvus-minio:
    image: minio/minio:RELEASE.2023-03-13T19-46-17Z
    environment:
      MINIO_ACCESS_KEY: minioadmin
      MINIO_SECRET_KEY: minioadmin
    volumes:
      - minio_data:/data
    command: minio server /data

  milvus:
    image: milvusdb/milvus:v2.4.0
    depends_on:
      - milvus-etcd
      - milvus-minio
    ports:
      - "19530:19530"
    volumes:
      - milvus_data:/var/lib/milvus

  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686"   # Jaeger UI
      - "4317:4317"     # OTEL gRPC

  langfuse:
    image: langfuse/langfuse:latest
    depends_on:
      - postgres
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://soul:${POSTGRES_PASSWORD}@postgres:5432/langfuse
      NEXTAUTH_SECRET: ${LANGFUSE_SECRET}
      SALT: ${LANGFUSE_SALT}

  backend:
    build: ./backend
    depends_on:
      - postgres
      - milvus
      - langfuse
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://soul:${POSTGRES_PASSWORD}@postgres:5432/soulscribe
      MILVUS_HOST: milvus
      MILVUS_PORT: 19530
      LANGFUSE_HOST: http://langfuse:3000
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      OTEL_EXPORTER_OTLP_ENDPOINT: http://jaeger:4317
    volumes:
      - ./backend:/app

  frontend:
    build: ./frontend
    depends_on:
      - backend
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app

volumes:
  postgres_data:
  etcd_data:
  minio_data:
  milvus_data:
```

---

## MCP Architecture

### SOULSCRIBE as MCP Server (other tools can query your brain)
```python
Tools exposed:
  add_entry(content: str) → EntryId
  ask_oracle(question: str) → OracleResponse  # includes confidence score
  get_person_brief(name: str) → PersonSummary
  search_entries(query: str, limit: int) → List[Entry]
  get_upcoming_events(days_ahead: int) → List[Event]
  get_confidence_report(question: str) → ConfidenceBreakdown
```

### SOULSCRIBE as MCP Client (reads from your environment)
```python
Filesystem MCP → reads ~/notes/, ~/Documents/journals/
                  auto-ingest existing notes on first run
Calendar MCP   → upcoming meetings → proactive briefings (optional)
```

---

## Project Structure

```
soulscribe/
├── backend/
│   ├── agents/
│   │   ├── orchestrator.py           # routes all inputs
│   │   ├── journal_intelligence.py   # extracts structured data from entries
│   │   ├── oracle.py                 # answers life questions with sources
│   │   ├── pattern.py                # detects behavioral patterns
│   │   ├── memory_curator.py         # recall, people, events
│   │   ├── decision_coach.py         # decision support with history
│   │   ├── knowledge_vault.py        # developer-only ingestion agent
│   │   └── pii_guardian.py           # always-on guardrail
│   ├── confidence/
│   │   └── scorer.py                 # 5-metric confidence scoring system
│   ├── wisdom/
│   │   └── retriever.py              # semantic search over knowledge_vault
│   ├── api/
│   │   ├── routes/
│   │   │   ├── entries.py
│   │   │   ├── oracle.py
│   │   │   ├── people.py
│   │   │   ├── insights.py
│   │   │   └── admin.py              # vault management (dev-only)
│   │   └── main.py
│   ├── db/
│   │   ├── postgres.py               # SQLAlchemy models + migrations
│   │   └── milvus.py                 # collection schemas + query helpers
│   ├── evals/
│   │   ├── suite_extraction.py
│   │   ├── suite_oracle.py
│   │   ├── suite_vault_uplift.py
│   │   ├── suite_confidence_calibration.py
│   │   ├── suite_pii.py
│   │   └── run_all.py
│   ├── mcp/
│   │   ├── server.py                 # expose soulscribe as MCP server
│   │   └── client.py                 # consume filesystem MCP
│   ├── observability/
│   │   ├── langfuse_setup.py         # LLM tracing
│   │   └── otel_setup.py             # infra tracing → Jaeger
│   └── models/
│       ├── entry.py
│       ├── person.py
│       ├── knowledge_source.py
│       ├── psychology_profile.py
│       └── confidence_report.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── EntryComposer/
│   │   │   ├── OracleChat/
│   │   │   │   ├── ConfidenceReport.tsx   # animated score bars
│   │   │   │   ├── SourceCard.tsx         # expandable entry/theory citations
│   │   │   │   └── StreamingResponse.tsx
│   │   │   ├── Timeline/
│   │   │   ├── PeopleGrid/
│   │   │   ├── InsightPanel/
│   │   │   ├── PatternCards/
│   │   │   └── Admin/
│   │   │       ├── VaultUploader.tsx
│   │   │       └── VaultTable.tsx
│   │   ├── pages/
│   │   │   ├── Today.tsx
│   │   │   ├── Oracle.tsx
│   │   │   ├── Timeline.tsx
│   │   │   ├── People.tsx
│   │   │   ├── Ideas.tsx
│   │   │   ├── Patterns.tsx
│   │   │   └── Admin.tsx             # gated by VITE_ADMIN_MODE=true
│   │   └── App.tsx
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Tech Stack

```yaml
Frontend:
  Framework:    React 18 + TypeScript + Vite
  Styling:      Tailwind CSS
  Animation:    Framer Motion
  State:        React Query (server state) + Zustand (local)
  Realtime:     WebSockets (streaming Oracle responses)
  Charts:       Recharts (confidence score history, pattern timelines)

Backend:
  Framework:    FastAPI (Python 3.12)
  Agents:       Pydantic AI (all 8 agents)
  Evaluation:   Pydantic Evals (5 suites)
  ORM:          SQLAlchemy 2.0 + Alembic (migrations)

Databases:
  Structured:   PostgreSQL 16
  Vectors:      Milvus 2.4 (4 collections)

Observability:
  LLM layer:    Langfuse (prompt tracing, cost, quality, A/B)
  Infra layer:  OpenTelemetry → Jaeger

LLMs:
  Primary:      Claude Sonnet (Oracle, Decision Coach — complex reasoning)
  Fast:         Claude Haiku (extraction, classification — speed)
  Embeddings:   OpenAI text-embedding-3-small (1536 dimensions)

MCP:
  Library:      FastMCP
  Server:       SOULSCRIBE exposed as MCP tool
  Client:       Filesystem MCP for note ingestion

Infrastructure:
  Runtime:      Docker + Docker Compose (fully local)
  Services:     PostgreSQL, Milvus, etcd, MinIO, Jaeger, Langfuse, Backend, Frontend
```

---

## Getting Started

```bash
# 1. Clone
git clone <repo> && cd soulscribe

# 2. Configure environment
cp .env.example .env
# Fill in: OPENAI_API_KEY, ANTHROPIC_API_KEY, POSTGRES_PASSWORD, LANGFUSE_SECRET, LANGFUSE_SALT

# 3. Start all infrastructure + services
docker compose up -d

# 4. Run database migrations
docker compose exec backend python -m alembic upgrade head

# 5. Initialize Milvus collections
docker compose exec backend python -m db.milvus --init

# 6. Open the app
open http://localhost:5173        # SOULSCRIBE UI
open http://localhost:3000        # Langfuse dashboard
open http://localhost:16686       # Jaeger trace explorer

# 7. Admin — feed the Knowledge Vault (developer only)
# Navigate to http://localhost:5173/admin (requires VITE_ADMIN_MODE=true in .env)

# 8. Run all evals
docker compose exec backend python -m evals.run_all
```

---

## What Makes SOULSCRIBE Different

| Generic diary / AI chat | SOULSCRIBE |
|---|---|
| Stores what you write | Understands what you mean and who you are |
| Full-text search | Semantic, psychological, theory-grounded search |
| Generic advice | Advice grounded in YOUR history + universal science |
| Confident when it shouldn't be | Confidence score — honest when evidence is thin |
| No privacy layer | PII stripped before anything is stored |
| Forgets you each session | Builds a psychological model of you over time |
| No universal knowledge | Developer-curated Wisdom Vault — science-backed answers |

---

*SOULSCRIBE — Because your life deserves to be remembered, understood, and guided by both experience and wisdom.*
