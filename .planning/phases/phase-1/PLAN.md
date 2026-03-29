# Phase 1 Plan: Foundation — Robust Metadata System v2

## Phase Goal

Transform the existing "AI Improvement" feature into a **robust, fault-tolerant metadata extraction system** that:

1. Extracts structured metadata using AI (single call)
2. Normalizes and repairs AI output before usage (critical layers)
3. Stores consistent, clean, and scalable metadata
4. Enables meaningful search with weighted scoring
5. Minimizes user friction while preserving control

**Success Criteria:**
- Metadata always passes through `normalizeAIResponse()` + `validateAndRepair()`
- Tags are clean, deduplicated, lowercase, max 8
- System handles malformed AI responses gracefully (never breaks UX)
- Search returns relevant results (weighted scoring: title×3, tags×2, description×1)
- Saving works without forcing user edits (low-friction flow)
- 70–80% categorization accuracy on diverse test set (realistic target)

---

## Non-Negotiable Principles

1. **AI output is unreliable by default** — Never trust raw AI JSON
2. **Consistency > Intelligence** — Clean, predictable data beats "smart" messy data
3. **Search is the product** — Metadata exists only to improve retrieval
4. **Low friction wins** — Metadata should not block saving

---

## Core Architecture: Data Flow (MANDATORY)

```
User Input
   ↓
AI Extraction (single call)
   ↓
normalizeAIResponse() ← Critical normalization layer
   ↓
validateAndRepair()   ← Critical validation layer
   ↓
UI Form (auto-applied, editable)
   ↓
savePrompt()
```

---

## Task Breakdown (Revised)

### 🧠 Task 1.1 — Flexible Metadata Schema (Scalable)

**Dependencies:** None
**Estimate:** 1.5h
**Priority:** P0 (Critical)

**Implementation:**
1. Replace rigid schema with flexible structure in `main.js`:

```javascript
const METADATA_SCHEMA = {
  schemaVersion: 2, // For future migrations
  id: string,
  type: 'image' | 'video' | 'code' | 'uncategorized',
  subtype: string, // Will be validated against registry
  tags: string[],
  confidence: number, // 0.0 - 1.0

  attributes: {
    // Dynamic key-value pairs depending on type
    // Examples:
    // camera_angle: "low angle"
    // shot_type: "portrait"
    // lighting: "soft natural light"
    // language: "python"
    // function_name: "calculateFibonacci"
  },

  created: ISO8601,
  updated: ISO8601,
  usage_count: number
};
```

2. Create `subtypeRegistry` for controlled vocabulary:

```javascript
const SUBTYPE_REGISTRY = {
  image: ['portrait', 'landscape', 'product', 'macro', 'street', 'abstract', 'other'],
  video: ['interview', 'b-roll', 'timelapse', 'tutorial', 'documentary', 'other'],
  code: ['function', 'class', 'api', 'script', 'component', 'query', 'other']
};
```

3. Add `TAG_SYNONYMS` map for search expansion (immediate, not future):

```javascript
const TAG_SYNONYMS = {
  'portrait': ['portrait', 'headshot', 'face', 'person'],
  'landscape': ['landscape', 'scenery', 'nature', 'outdoor'],
  'code': ['code', 'programming', 'script', 'development']
};
```

**Acceptance Criteria:**
- [ ] METADATA_SCHEMA defined with `schemaVersion: 2`
- [ ] `attributes` object replaces hardcoded camera/subject/setting
- [ ] SUBTYPE_REGISTRY limits subtype values
- [ ] TAG_SYNONYMS map defined for search expansion

**Verify:**
```javascript
console.log('Schema version:', METADATA_SCHEMA.schemaVersion);
console.log('Subtypes for image:', SUBTYPE_REGISTRY.image);
```

---

### 🤖 Task 1.2 — Unified AI Extraction (Strict Output Contract)

**Dependencies:** Task 1.1 (schema)
**Estimate:** 2h
**Priority:** P1 (High)

**Implementation:**
1. Create `buildAIPrompt(content, title, description)` function with strict JSON-only output:

```javascript
async function buildAIPrompt(content, title, description) {
  const systemPrompt = `You are a metadata extraction AI. Analyze the prompt and return ONLY valid JSON.
NO markdown, NO explanations, NO code blocks. Just raw JSON.

Return this exact structure:
{
  "type": "image|video|code|uncategorized",
  "subtype": "specific subtype from registry or 'other'",
  "confidence": 0.0-1.0,
  "tags": ["tag1", "tag2"],
  "attributes": {
    "key": "value"
  }
}

Prompt to analyze:
Title: ${title}
Description: ${description || 'N/A'}
Content: ${content}

Remember: Return ONLY JSON, no other text.`;

  const response = await puter.ai.chat(systemPrompt);
  return response;
}
```

2. Add content-based type detection as sanity check:

```javascript
function detectTypeFromContent(content) {
  const lower = content.toLowerCase();
  if (lower.includes('--ar') || lower.includes('photograph') || lower.includes('shot of')) {
    return 'image';
  }
  if (lower.includes('function') || lower.includes('```') || lower.includes('const ') || lower.includes('import ')) {
    return 'code';
  }
  if (lower.includes('video') || lower.includes('footage') || lower.includes('scene')) {
    return 'video';
  }
  return 'uncategorized';
}
```

**Acceptance Criteria:**
- [ ] AI returns raw JSON only (no markdown)
- [ ] Response includes all required fields
- [ ] Type is one of: image, video, code, uncategorized
- [ ] Confidence is 0.0-1.0
- [ ] Attributes object contains relevant metadata

**Verify:**
```javascript
const testPrompt = "A portrait shot of a woman in golden hour lighting";
const result = await buildAIPrompt(testPrompt, "Golden Hour Portrait", "");
console.log('AI Response:', result);
console.log('Detected type:', detectTypeFromContent(testPrompt));
```

---

### 🛠️ Task 1.3 — AI Response Normalization Layer (CRITICAL)

**Dependencies:** Task 1.2
**Estimate:** 2h
**Priority:** P0 (Critical)

**Implementation:**
1. Create `normalizeAIResponse(raw)` function:

```javascript
function normalizeAIResponse(raw) {
  let parsed;

  // Step 1: Fix invalid JSON (remove markdown code blocks if present)
  try {
    const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    parsed = JSON.parse(cleaned);
  } catch (e) {
    console.warn('JSON parse failed, using fallback:', e);
    return createFallbackMetadata('parse_error');
  }

  // Step 2: Ensure required fields exist with defaults
  const normalized = {
    type: parsed.type || 'uncategorized',
    subtype: parsed.subtype || 'other',
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
    tags: normalizeTags(parsed.tags || []),
    attributes: parsed.attributes || {}
  };

  // Step 3: Normalize types
  normalized.type = normalized.type.toLowerCase();
  if (!['image', 'video', 'code', 'uncategorized'].includes(normalized.type)) {
    normalized.type = 'uncategorized';
  }

  // Step 4: Normalize subtype
  normalized.subtype = normalized.subtype.toLowerCase().trim();

  // Step 5: Clean attributes (remove null/undefined values)
  Object.keys(normalized.attributes).forEach(key => {
    if (normalized.attributes[key] === null || normalized.attributes[key] === undefined) {
      delete normalized.attributes[key];
    }
  });

  return normalized;
}

function normalizeTags(tags) {
  if (typeof tags === 'string') {
    tags = tags.split(',');
  }
  return tags
    .map(tag => tag.toLowerCase().trim())
    .filter(tag => tag.length > 0)
    .slice(0, 8); // Max 8 tags
}

function createFallbackMetadata(reason) {
  console.warn('Using fallback metadata, reason:', reason);
  return {
    type: 'uncategorized',
    subtype: 'unknown',
    confidence: 0,
    tags: [],
    attributes: {},
    needsAIReview: true
  };
}
```

**Acceptance Criteria:**
- [ ] Function handles malformed JSON gracefully
- [ ] Function strips markdown code blocks from AI response
- [ ] All required fields present after normalization
- [ ] Tags converted from string to array if needed
- [ ] Null/undefined values converted to empty defaults
- [ ] Returns fallback metadata on parse failure

**Verify:**
```javascript
// Test malformed JSON
const malformed = '{"type": "image", "tags": "portrait, sexy"}'; // tags as string
const normalized = normalizeAIResponse(malformed);
console.log('Normalized tags:', normalized.tags); // Should be array

// Test markdown response
const markdown = '```json\n{"type": "video"}\n```';
const cleaned = normalizeAIResponse(markdown);
console.log('Cleaned type:', cleaned.type);
```

---

### 🧪 Task 1.4 — Validation & Repair Layer

**Dependencies:** Task 1.3
**Estimate:** 1.5h
**Priority:** P0 (Critical)

**Implementation:**
1. Create `validateAndRepair(metadata)` function:

```javascript
function validateAndRepair(metadata) {
  const repaired = { ...metadata };

  // Enforce type validity
  const validTypes = ['image', 'video', 'code', 'uncategorized'];
  if (!validTypes.includes(repaired.type)) {
    console.warn('Invalid type repaired:', repaired.type);
    repaired.type = 'uncategorized';
  }

  // Enforce subtype against registry
  const validSubtypes = SUBTYPE_REGISTRY[repaired.type] || SUBTYPE_REGISTRY.code;
  if (!validSubtypes.includes(repaired.subtype)) {
    console.warn('Invalid subtype repaired:', repaired.subtype);
    repaired.subtype = 'other';
  }

  // Enforce tags constraints
  if (!Array.isArray(repaired.tags)) {
    repaired.tags = [];
  }
  repaired.tags = repaired.tags.slice(0, 8); // Max 8 tags

  // Enforce confidence range
  if (typeof repaired.confidence !== 'number' || repaired.confidence < 0 || repaired.confidence > 1) {
    repaired.confidence = 0.5;
  }

  // Ensure attributes is object
  if (typeof repaired.attributes !== 'object' || repaired.attributes === null) {
    repaired.attributes = {};
  }

  // Remove unknown top-level fields (schema enforcement)
  const allowedFields = ['type', 'subtype', 'tags', 'confidence', 'attributes'];
  Object.keys(repaired).forEach(key => {
    if (!allowedFields.includes(key)) {
      delete repaired[key];
    }
  });

  return repaired;
}
```

2. Add confidence threshold rules:

```javascript
function getConfidenceLevel(confidence) {
  if (confidence < 0.4) return 'low';
  if (confidence < 0.7) return 'medium';
  return 'high';
}

function needsReview(metadata) {
  return metadata.confidence < 0.4 || metadata.needsAIReview === true;
}
```

**Acceptance Criteria:**
- [ ] Invalid types repaired to 'uncategorized'
- [ ] Invalid subtypes repaired to 'other'
- [ ] Tags limited to max 8
- [ ] Confidence clamped to 0.0-1.0
- [ ] Unknown fields removed
- [ ] Confidence level helper function works

**Verify:**
```javascript
const invalid = {
  type: 'photo', // invalid
  subtype: 'portraits', // not in registry
  tags: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'], // 10 tags
  confidence: 1.5, // out of range
  unknownField: 'should be removed'
};
const repaired = validateAndRepair(invalid);
console.log('Repaired:', repaired);
// Expected: type='uncategorized', subtype='other', tags=8, confidence=0.5
```

---

### 🏷️ Task 1.5 — Tag Normalization System

**Dependencies:** Task 1.3 (normalizeTags already implemented)
**Estimate:** 1h
**Priority:** P2 (Medium)

**Implementation:**
1. Enhance `normalizeTag()` with synonym expansion for search:

```javascript
function normalizeTag(tag) {
  return tag.toLowerCase().trim();
}

function expandTagsWithSynonyms(tags) {
  const expanded = new Set(tags.map(normalizeTag));

  tags.forEach(tag => {
    const normalized = normalizeTag(tag);
    Object.entries(TAG_SYNONYMS).forEach(([canonical, synonyms]) => {
      if (synonyms.includes(normalized)) {
        expanded.add(canonical);
      }
    });
  });

  return Array.from(expanded).slice(0, 8);
}

function deduplicateTags(tags) {
  const seen = new Set();
  return tags.filter(tag => {
    const normalized = normalizeTag(tag);
    if (seen.has(normalized)) {
      return false;
    }
    seen.add(normalized);
    return true;
  });
}
```

**Acceptance Criteria:**
- [ ] Tags are lowercase and trimmed
- [ ] Duplicate tags removed
- [ ] Max 8 tags enforced
- [ ] Synonym expansion works for search

**Verify:**
```javascript
const tags = ['Portrait', 'portrait', '  HEADSHOT  ', 'landscape'];
console.log('Deduped:', deduplicateTags(tags));
console.log('Expanded:', expandTagsWithSynonyms(['headshot']));
```

---

### ⚡ Task 1.6 — Low-Friction UX Flow

**Dependencies:** Task 1.1 (schema)
**Estimate:** 2h
**Priority:** P1 (High)

**Implementation:**
1. Update `index.html` modal:
   - Replace `.ai-improvement` section with metadata display area
   - Remove "Use Extracted" button (auto-apply)
   - Add visual confidence indicator (color + icon)
   - Add "Needs Review" badge for low-confidence extractions

```html
<div class="metadata-extraction" id="metadataExtraction">
    <div class="extraction-header">
        <span class="extraction-title">AI Metadata</span>
        <span class="confidence-indicator" id="confidenceIndicator">
            <!-- Green/Yellow/Red based on confidence -->
        </span>
    </div>

    <div class="metadata-fields">
        <div class="form-row">
            <select id="metaType">
                <option value="image">📷 Image</option>
                <option value="video">🎬 Video</option>
                <option value="code">💻 Code</option>
                <option value="uncategorized">❓ Uncategorized</option>
            </select>

            <select id="metaSubtype">
                <!-- Dynamically populated based on type -->
            </select>
        </div>

        <input type="text" id="metaTags" placeholder="Tags (comma-separated)" />

        <details class="metadata-advanced">
            <summary>Advanced Attributes</summary>
            <div id="attributesContainer">
                <!-- Dynamic key-value pairs -->
            </div>
        </details>
    </div>

    <button class="btn btn-secondary" onclick="clearMetadata()">Clear Metadata</button>
</div>
```

2. Add CSS for confidence indicator:

```css
.confidence-indicator {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
}
.confidence-high { background: var(--success); color: white; }
.confidence-medium { background: var(--warning); color: black; }
.confidence-low { background: var(--danger); color: white; }

.needs-review-badge {
    background: var(--warning);
    color: black;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
}
```

3. Auto-apply metadata on extraction (no "Use Extracted" button):

```javascript
async function extractMetadata() {
  const content = document.getElementById('promptContent').value;
  const title = document.getElementById('promptTitle').value;
  const description = document.getElementById('promptDescription').value;

  showLoading();
  try {
    const rawAI = await buildAIPrompt(content, title, description);
    const normalized = normalizeAIResponse(rawAI);
    const validated = validateAndRepair(normalized);

    // Auto-apply to form
    document.getElementById('metaType').value = validated.type;
    updateSubtypeOptions(validated.type);
    document.getElementById('metaSubtype').value = validated.subtype;
    document.getElementById('metaTags').value = validated.tags.join(', ');
    renderAttributes(validated.attributes);

    // Show confidence indicator
    updateConfidenceIndicator(validated.confidence);

    // Show review warning if needed
    if (needsReview(validated)) {
      showReviewWarning();
    }

    showToast('Metadata extracted', 'success');
  } catch (error) {
    console.error('Extraction failed:', error);
    showToast('AI extraction failed. Enter metadata manually.', 'error');
  } finally {
    hideLoading();
  }
}
```

**Acceptance Criteria:**
- [ ] Metadata auto-applied immediately (no "Use Extracted" button)
- [ ] Confidence indicator shows green/yellow/red
- [ ] "Needs Review" badge visible for confidence < 0.4
- [ ] All metadata fields editable
- [ ] "Clear Metadata" button resets fields
- [ ] Collapsible "Advanced Attributes" section

**Verify:**
```javascript
// Manual test: Create prompt, click "Extract Metadata", verify:
// 1. Fields populate automatically
// 2. Confidence indicator shows correct color
// 3. All fields are editable
```

---

### 💾 Task 1.7 — Save Function (Clean & Consistent)

**Dependencies:** Tasks 1.3, 1.4, 1.6
**Estimate:** 2h
**Priority:** P0 (Critical)

**Implementation:**
1. Update `savePrompt()` to always pass through normalization + validation:

```javascript
async function savePrompt() {
  const title = document.getElementById('promptTitle').value;
  const description = document.getElementById('promptDescription').value;
  const content = document.getElementById('promptContent').value;

  if (!title || !content) {
    showToast('Please fill in title and content', 'error');
    return;
  }

  showLoading();
  try {
    // Build metadata from form
    const type = document.getElementById('metaType').value;
    const subtype = document.getElementById('metaSubtype').value;
    const tags = document.getElementById('metaTags').value
      .split(',')
      .map(t => normalizeTag(t))
      .filter(t => t)
      .slice(0, 8);

    const attributes = collectAttributesFromForm();

    // Build prompt object
    const prompt = {
      schemaVersion: 2,
      id: editingPromptId || generateUniqueId(),
      title,
      description,
      content,
      metadata: {
        type,
        subtype,
        tags,
        confidence: getCurrentConfidence() || 1.0, // 1.0 if manual entry
        attributes
      },
      created: editingPromptId
        ? prompts.find(p => p.id === editingPromptId).created
        : new Date().toISOString(),
      updated: new Date().toISOString(),
      usage_count: editingPromptId
        ? (prompts.find(p => p.id === editingPromptId).usage_count || 0)
        : 0
    };

    // Validate before save (defense in depth)
    prompt.metadata = validateAndRepair(prompt.metadata);

    // Save to storage
    if (editingPromptId) {
      const index = prompts.findIndex(p => p.id === editingPromptId);
      prompts[index] = { ...prompts[index], ...prompt };
    } else {
      prompts.unshift(prompt);
    }

    await puter.kv.set('prompts', JSON.stringify(prompts));

    hidePromptModal();
    renderPrompts();
    showToast('Prompt saved successfully!', 'success');
  } catch (error) {
    console.error('Error saving prompt:', error);
    showToast('Error saving prompt. Please try again.', 'error');
  } finally {
    hideLoading();
  }
}

function generateUniqueId() {
  return 'prompt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}
```

2. Add AI call optimization (hash/caching):

```javascript
const AI_CACHE = new Map();

function hashPrompt(content) {
  // Simple hash (for production, use crypto.subtle.digest)
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
}

async function extractMetadataWithCache(content, title, description) {
  const hash = hashPrompt(content + title + description);

  if (AI_CACHE.has(hash)) {
    console.log('AI cache hit');
    return AI_CACHE.get(hash);
  }

  const result = await extractMetadataWithFallback(content, title, description);
  AI_CACHE.set(hash, result);
  return result;
}

async function extractMetadataWithFallback(content, title, description) {
  try {
    const rawAI = await buildAIPrompt(content, title, description);
    const normalized = normalizeAIResponse(rawAI);
    return validateAndRepair(normalized);
  } catch (error) {
    console.warn('AI extraction failed, using fallback:', error);
    return {
      type: 'uncategorized',
      subtype: 'unknown',
      confidence: 0,
      tags: [],
      attributes: {},
      needsAIReview: true
    };
  }
}
```

3. Add backward compatibility for legacy prompts:

```javascript
function migrateLegacyPrompt(prompt) {
  if (!prompt.schemaVersion || prompt.schemaVersion < 2) {
    // Old prompt without metadata
    return {
      ...prompt,
      schemaVersion: 2,
      metadata: {
        type: prompt.type || 'uncategorized',
        subtype: prompt.subtype || 'other',
        tags: prompt.tags || [],
        confidence: 1.0, // Manual entry
        attributes: prompt.attributes || {}
      }
    };
  }
  return prompt;
}

// In initApp():
const storedPrompts = await puter.kv.get('prompts');
if (storedPrompts) {
  prompts = JSON.parse(storedPrompts).map(migrateLegacyPrompt);
}
```

**Acceptance Criteria:**
- [ ] All prompts save with `schemaVersion: 2`
- [ ] Metadata always passes through `validateAndRepair()`
- [ ] Legacy prompts migrate on load
- [ ] AI calls cached by content hash
- [ ] Fallback metadata on AI failure
- [ ] Unique ID generation works

**Verify:**
```javascript
// Test migration
const legacy = { id: '1', title: 'Old Prompt', content: '...', category: 'coding' };
const migrated = migrateLegacyPrompt(legacy);
console.log('Migrated metadata:', migrated.metadata);
// Expected: type='uncategorized', confidence=1.0
```

---

### 🔍 Task 1.8 — Search Engine (Weighted Scoring)

**Dependencies:** Task 1.7 (data model)
**Estimate:** 2h
**Priority:** P1 (High)

**Implementation:**
1. Create `scorePrompt(prompt, query)` function:

```javascript
function scorePrompt(prompt, query) {
  if (!query || query.trim() === '') {
    return 1; // Neutral score for empty query
  }

  const q = query.toLowerCase().trim();
  const words = q.split(/\s+/).filter(w => w.length > 0);

  let score = 0;

  // Title match (weight: 3)
  const titleLower = prompt.title.toLowerCase();
  words.forEach(word => {
    if (titleLower.includes(word)) {
      score += 3;
    }
  });

  // Tags match (weight: 2)
  const tags = prompt.metadata?.tags || [];
  tags.forEach(tag => {
    words.forEach(word => {
      if (tag.toLowerCase().includes(word)) {
        score += 2;
      }
    });
  });

  // Description match (weight: 1)
  const descLower = (prompt.description || '').toLowerCase();
  words.forEach(word => {
    if (descLower.includes(word)) {
      score += 1;
    }
  });

  // Content match (weight: 1)
  const contentLower = prompt.content.toLowerCase();
  words.forEach(word => {
    if (contentLower.includes(word)) {
      score += 1;
    }
  });

  // Expand with synonyms
  words.forEach(word => {
    Object.entries(TAG_SYNONYMS).forEach(([canonical, synonyms]) => {
      if (synonyms.includes(word) && titleLower.includes(canonical)) {
        score += 2; // Bonus for synonym match
      }
    });
  });

  return score;
}

function searchPrompts(query, filters = {}) {
  let results = prompts.map(p => ({ ...p, score: scorePrompt(p, query) }));

  // Apply filters
  if (filters.type) {
    results = results.filter(p => p.metadata?.type === filters.type);
  }
  if (filters.subtype) {
    results = results.filter(p => p.metadata?.subtype === filters.subtype);
  }
  if (filters.tags && filters.tags.length > 0) {
    results = results.filter(p => {
      const promptTags = p.metadata?.tags || [];
      return filters.tags.some(tag => promptTags.includes(tag));
    });
  }

  // Filter out zero scores (no match)
  results = results.filter(r => r.score > 0);

  // Sort by score DESC
  results.sort((a, b) => b.score - a.score);

  return results;
}
```

**Acceptance Criteria:**
- [ ] Title matches weighted 3×
- [ ] Tag matches weighted 2×
- [ ] Description/content matches weighted 1×
- [ ] Synonym expansion works
- [ ] Results sorted by score DESC
- [ ] Filters combine correctly

**Verify:**
```javascript
const query = "portrait golden hour";
const results = searchPrompts(query);
console.log('Top results:', results.slice(0, 5));
```

---

### 🔎 Task 1.9 — Filtering System

**Dependencies:** Task 1.8 (search)
**Estimate:** 1.5h
**Priority:** P2 (Medium)

**Implementation:**
1. Update UI toolbar with filters:

```html
<div class="toolbar">
    <input type="text" class="search-box" placeholder="Search prompts..." id="searchInput" />

    <div class="filters">
        <select id="filterType">
            <option value="">All Types</option>
            <option value="image">📷 Image</option>
            <option value="video">🎬 Video</option>
            <option value="code">💻 Code</option>
        </select>

        <div id="tagFilters" class="tag-filters">
            <!-- Dynamically populated tag pills -->
        </div>
    </div>
</div>
```

2. Combine filters with search:

```javascript
function applyFilters() {
  const query = document.getElementById('searchInput').value;
  const typeFilter = document.getElementById('filterType').value;
  const activeTags = getActiveTagFilters();

  const filters = {
    type: typeFilter || undefined,
    tags: activeTags
  };

  const results = searchPrompts(query, filters);
  renderPrompts(results);
}

function getActiveTagFilters() {
  return Array.from(document.querySelectorAll('.tag-pill.active'))
    .map(pill => pill.dataset.tag);
}

function renderTagFilters() {
  // Extract all unique tags from prompts
  const allTags = new Set();
  prompts.forEach(p => {
    (p.metadata?.tags || []).forEach(tag => allTags.add(tag));
  });

  const container = document.getElementById('tagFilters');
  container.innerHTML = Array.from(allTags).slice(0, 20).map(tag => `
    <span class="tag-pill" data-tag="${tag}" onclick="toggleTagFilter('${tag}')">
      ${tag}
    </span>
  `).join('');
}

function toggleTagFilter(tag) {
  const pill = document.querySelector(`[data-tag="${tag}"]`);
  pill.classList.toggle('active');
  applyFilters();
}
```

**Acceptance Criteria:**
- [ ] Type filter dropdown works
- [ ] Tag pills toggle on/off
- [ ] Filters combine with text search
- [ ] Results update in real-time

**Verify:**
```javascript
// Manual test: Select type="image", tag="portrait", search="golden"
// Verify: Only image prompts with "portrait" tag and "golden" in content
```

---

### 🧠 Task 1.10 — AI Call Optimization (Cost Control)

**Dependencies:** Task 1.7 (already implemented in save function)
**Estimate:** 0.5h (already covered)
**Priority:** P2 (Medium)

**Note:** This task is already implemented as part of Task 1.7 (hash/caching).

**Acceptance Criteria:**
- [ ] AI_CACHE Map defined
- [ ] `hashPrompt()` function works
- [ ] Cache checked before AI call
- [ ] Results cached after successful extraction

**Verify:**
```javascript
const hash1 = hashPrompt("test content");
const hash2 = hashPrompt("test content");
console.log('Hash consistency:', hash1 === hash2); // Should be true
```

---

### 🧪 Task 1.11 — Real Testing Dataset

**Dependencies:** All previous tasks
**Estimate:** 2h
**Priority:** P3 (Low)

**Implementation:**
1. Create test dataset (50-100 prompts):

```javascript
const TEST_PROMPTS = [
  // Image prompts
  {
    content: "A portrait shot of a woman sitting by the window during golden hour, soft natural lighting, shallow depth of field",
    expectedType: 'image',
    expectedSubtype: 'portrait',
    expectedTags: ['portrait', 'golden hour', 'natural lighting']
  },
  {
    content: "Landscape photography of mountains at sunrise, misty valley, wide angle shot",
    expectedType: 'image',
    expectedSubtype: 'landscape',
    expectedTags: ['landscape', 'mountains', 'sunrise']
  },
  // Code prompts
  {
    content: "Write a Python function that calculates fibonacci sequence using recursion",
    expectedType: 'code',
    expectedSubtype: 'function',
    expectedTags: ['python', 'function', 'fibonacci', 'recursion']
  },
  {
    content: "Create a React component with useState hook for a todo list",
    expectedType: 'code',
    expectedSubtype: 'component',
    expectedTags: ['react', 'component', 'hooks', 'todo']
  },
  // Video prompts
  {
    content: "A timelapse video of a sunset over the mountains, clouds moving quickly",
    expectedType: 'video',
    expectedSubtype: 'timelapse',
    expectedTags: ['timelapse', 'sunset', 'mountains']
  },
  // Ambiguous prompts
  {
    content: "Create something beautiful",
    expectedType: 'uncategorized',
    expectedSubtype: 'other',
    expectedTags: []
  }
  // ... add 50-100 total
];

function runTestSuite() {
  let passed = 0;
  let failed = 0;

  TEST_PROMPTS.forEach(async (test, index) => {
    try {
      const result = await extractMetadataWithFallback(test.content, '', '');
      const typeMatch = result.type === test.expectedType;
      const subtypeMatch = result.subtype === test.expectedSubtype;

      if (typeMatch && subtypeMatch) {
        passed++;
        console.log(`✅ Test ${index + 1}: PASS`);
      } else {
        failed++;
        console.log(`❌ Test ${index + 1}: FAIL`);
        console.log('  Expected:', test.expectedType, test.expectedSubtype);
        console.log('  Got:', result.type, result.subtype);
      }
    } catch (error) {
      failed++;
      console.log(`❌ Test ${index + 1}: ERROR`, error);
    }
  });

  const accuracy = (passed / TEST_PROMPTS.length) * 100;
  console.log(`\n=== Test Results ===`);
  console.log(`Passed: ${passed}/${TEST_PROMPTS.length}`);
  console.log(`Accuracy: ${accuracy.toFixed(1)}%`);
  console.log(`Target: 70-80%`);

  return { passed, failed, accuracy };
}
```

2. Include edge cases:
   - Very short prompts (1-2 words)
   - Very long prompts (5000+ characters)
   - Ambiguous prompts intentionally
   - Multi-language prompts
   - Prompts with mixed code + natural language

**Acceptance Criteria:**
- [ ] Test dataset has 50-100 prompts
- [ ] Covers all types (image, video, code)
- [ ] Includes ambiguous/edge cases
- [ ] Accuracy measurement automated
- [ ] Target: 70-80% (realistic)

**Verify:**
```javascript
const results = runTestSuite();
console.log('Final accuracy:', results.accuracy);
```

---

## Implementation Order

```
P0 (Critical):
  1.1 Schema → 1.3 Normalization → 1.4 Validation → 1.7 Save

P1 (High):
  1.2 AI Extraction → 1.6 UX Flow → 1.8 Search

P2 (Medium):
  1.5 Tags → 1.9 Filters → 1.10 Cache

P3 (Low):
  1.11 Testing Dataset
```

**Total Estimated Time:** 18 hours (increased from 12h due to critical normalization layers)

---

## Removed / Changed Concepts

| Removed/Changed | Reason |
|-----------------|--------|
| Hardcoded camera/subject/setting | Not scalable → replaced with `attributes` |
| "Use Extracted" button | Adds friction → auto-apply |
| `source` (ai/manual/mixed) | Low value vs complexity |
| 90% accuracy goal | Unrealistic → 70-80% target |
| Rigid nested schema | Replaced with flexible `attributes` object |

---

## Postponed to Future Phases

| Feature | Postponed To | Reason |
|---------|--------------|--------|
| Prompt lineage (parentId, variants) | Phase 4 | Not critical for MVP |
| Event sourcing for metadata | Phase 4 | Adds complexity |
| Full migration batch processing | Phase 2 | Can migrate on-demand |
| Advanced synonym mapping | Phase 2 | Basic map sufficient for now |
| Duplicate detection | Phase 4 | Low priority |
| Export/Import with metadata | Phase 3 | Separate feature |

---

## Verification Checklist

Before marking Phase 1 complete, verify:

- [ ] AI output always passes through `normalizeAIResponse()` + `validateAndRepair()`
- [ ] Tags are clean, deduplicated, lowercase, max 8
- [ ] Metadata never breaks UI (even with bad AI output)
- [ ] Saving works without forcing user edits
- [ ] Search returns relevant results (weighted scoring)
- [ ] Filters combine correctly (type + tags + search)
- [ ] Prompts without metadata still load correctly (backward compatibility)
- [ ] AI calls are cached (hash check)
- [ ] System handles malformed AI responses gracefully (fallback)
- [ ] Confidence indicator shows correct color (green/yellow/red)
- [ ] "Needs Review" badge shows for confidence < 0.4
- [ ] Test suite runs with 70-80% accuracy target

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      User Creates Prompt                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              AI Extraction (Single Call)                     │
│         buildAIPrompt() → puter.ai.chat()                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│         ⚠️ normalizeAIResponse() (CRITICAL LAYER) ⚠️         │
│   - Strip markdown                                           │
│   - Parse JSON (fallback on error)                          │
│   - Convert types (string→array)                            │
│   - Set defaults                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│         ⚠️ validateAndRepair() (CRITICAL LAYER) ⚠️           │
│   - Enforce schema                                           │
│   - Remove unknown fields                                   │
│   - Clamp values (tags≤8, confidence 0-1)                   │
│   - Validate against registry                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              UI Form (Auto-Applied, Editable)               │
│   - Confidence indicator (green/yellow/red)                 │
│   - "Needs Review" badge if confidence < 0.4                │
│   - All fields editable                                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  savePrompt()                                │
│   - Final validateAndRepair() (defense in depth)            │
│   - Cache by hash                                            │
│   - Store in Puter.kv                                        │
└─────────────────────────────────────────────────────────────┘
```

---

**Created:** 2026-03-28 (Revised)
**Phase:** 1 of 4
**Status:** Ready for execution
**Schema Version:** 2
