// ============================================================================
// METADATA SCHEMA v2 (Task 1.1)
// ============================================================================

const METADATA_SCHEMA = {
  schemaVersion: 2,
  id: 'string',
  type: 'image | video | code | uncategorized',
  subtype: 'string',
  tags: 'string[]',
  confidence: 'number (0.0 - 1.0)',
  attributes: 'object (dynamic key-value pairs)',
  created: 'ISO8601',
  updated: 'ISO8601',
  usage_count: 'number'
};

const SUBTYPE_REGISTRY = {
  image: ['portrait', 'landscape', 'product', 'macro', 'street', 'abstract', 'other'],
  video: ['interview', 'b-roll', 'timelapse', 'tutorial', 'documentary', 'other'],
  code: ['function', 'class', 'api', 'script', 'component', 'query', 'other']
};

const TAG_SYNONYMS = {
  'portrait': ['portrait', 'headshot', 'face', 'person'],
  'landscape': ['landscape', 'scenery', 'nature', 'outdoor'],
  'code': ['code', 'programming', 'script', 'development']
};

// ============================================================================
// STATE
// ============================================================================

let prompts = [];
let currentCategory = 'all';
let editingPromptId = null;
let improvedContent = null;
let currentMetadata = null; // Store current extracted metadata

// ============================================================================
// TAG NORMALIZATION (Task 1.5)
// ============================================================================

function normalizeTag(tag) {
  return tag.toLowerCase().trim();
}

function normalizeTags(tags) {
  if (typeof tags === 'string') {
    tags = tags.split(',');
  }
  return tags
    .map(tag => normalizeTag(tag))
    .filter(tag => tag.length > 0)
    .slice(0, 8); // Max 8 tags
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

// ============================================================================
// AI RESPONSE NORMALIZATION (Task 1.3 - CRITICAL)
// ============================================================================

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

// ============================================================================
// VALIDATION & REPAIR LAYER (Task 1.4 - CRITICAL)
// ============================================================================

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

function getConfidenceLevel(confidence) {
  if (confidence < 0.4) return 'low';
  if (confidence < 0.7) return 'medium';
  return 'high';
}

function needsReview(metadata) {
  return metadata.confidence < 0.4 || metadata.needsAIReview === true;
}

// ============================================================================
// AI EXTRACTION - ZERO FRICTION (Task 1.2 + Phase 1 UX Fix)
// ============================================================================

/**
 * NEW: Extract ALL metadata from content only (zero-friction UX)
 * User only enters prompt content, AI extracts title, description, and all metadata
 */
async function extractAllWithAI(content) {
  console.log('🤖 [extractAllWithAI] Starting extraction for:', content.substring(0, 50) + '...');
  
  const systemPrompt = `You are a metadata extraction AI. Analyze this prompt and return ONLY valid JSON.
NO markdown, NO explanations, NO code blocks. Just raw JSON.

Return this exact structure:
{
  "title": "A short, descriptive title (3-6 words)",
  "description": "A one-sentence description (10-20 words)",
  "type": "image|video|code|uncategorized",
  "subtype": "specific subtype from registry or 'other'",
  "confidence": 0.0-1.0,
  "tags": ["tag1", "tag2"],
  "attributes": {
    "key": "value"
  }
}

Prompt to analyze:
${content}

Remember: Return ONLY JSON, no other text.`;

  try {
    console.log('🔄 [extractAllWithAI] Calling Puter.AI...');
    const response = await puter.ai.chat(systemPrompt);
    
    // Extract text from response object (Puter.AI returns an object, not string)
    const responseText = typeof response === 'object' 
      ? (response.message?.content || response.content || JSON.stringify(response))
      : response;
    
    console.log('✅ [extractAllWithAI] Puter.AI responded:', responseText.substring(0, 200));

    const cleaned = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    console.log('🧹 [extractAllWithAI] Cleaned response:', cleaned.substring(0, 200));
    
    const parsed = JSON.parse(cleaned);
    console.log('✅ [extractAllWithAI] Parsed JSON:', parsed);

    const result = {
      title: parsed.title || content.substring(0, 50) + '...',
      description: parsed.description || '',
      metadata: {
        type: parsed.type || 'uncategorized',
        subtype: parsed.subtype || 'other',
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
        tags: normalizeTags(parsed.tags || []),
        attributes: parsed.attributes || {}
      }
    };
    
    console.log('✅ [extractAllWithAI] Final result:', result);
    return result;
  } catch (e) {
    console.error('❌ [extractAllWithAI] ERROR:', e);
    console.warn('⚠️ [extractAllWithAI] Using fallback due to error');
    return {
      title: content.substring(0, 50) + '...',
      description: '',
      metadata: {
        type: 'uncategorized',
        subtype: 'unknown',
        confidence: 0,
        tags: [],
        attributes: {},
        needsAIReview: true
      }
    };
  }
}

// Legacy function for backward compatibility (still used by test suite)
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
  
  // Extract text from response object (Puter.AI returns an object, not string)
  const responseText = typeof response === 'object' 
    ? (response.message?.content || response.content || JSON.stringify(response))
    : response;
  
  return responseText;
}

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

// ============================================================================
// AI CALL OPTIMIZATION (Task 1.10)
// ============================================================================

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

// ============================================================================
// UX FUNCTIONS (Task 1.6)
// ============================================================================

// ============================================================================
// METADATA EXTRACTION (Legacy - kept for backward compatibility)
// Now uses extractAllWithAI internally for consistency
// ============================================================================

async function extractMetadata() {
  const content = document.getElementById('promptContent').value;

  showLoading();
  try {
    console.log('🔄 [extractMetadata] Starting legacy extraction...');
    
    // Use new extractAllWithAI function (works with content only)
    const extracted = await extractAllWithAI(content);
    
    // Store for later use
    currentMetadata = extracted.metadata;

    // Show metadata section
    const metadataSection = document.getElementById('metadataExtraction');
    if (metadataSection) metadataSection.style.display = 'block';

    // Auto-apply to form
    const metaType = document.getElementById('metaType');
    if (metaType) {
      metaType.value = extracted.metadata.type;
      updateSubtypeOptions(extracted.metadata.type);
    }
    
    const metaSubtype = document.getElementById('metaSubtype');
    if (metaSubtype) metaSubtype.value = extracted.metadata.subtype;
    
    const metaTags = document.getElementById('metaTags');
    if (metaTags) metaTags.value = extracted.metadata.tags.join(', ');
    
    renderAttributes(extracted.metadata.attributes);

    // Show confidence indicator
    updateConfidenceIndicator(extracted.metadata.confidence);

    // Show review warning if needed
    if (needsReview(extracted.metadata)) {
      showReviewWarning();
    } else {
      hideReviewWarning();
    }

    showToast('Metadata extracted', 'success');
  } catch (error) {
    console.error('Extraction failed:', error);
    showToast('AI extraction failed. Enter metadata manually.', 'error');
  } finally {
    hideLoading();
  }
}

function updateSubtypeOptions(type) {
  const subtypeSelect = document.getElementById('metaSubtype');
  const subtypes = SUBTYPE_REGISTRY[type] || SUBTYPE_REGISTRY.code;

  subtypeSelect.innerHTML = subtypes.map(subtype =>
    `<option value="${subtype}">${subtype}</option>`
  ).join('');
}

function updateConfidenceIndicator(confidence) {
  const indicator = document.getElementById('confidenceIndicator');
  if (!indicator) return;

  const level = getConfidenceLevel(confidence);
  indicator.className = 'confidence-indicator';

  if (level === 'high') {
    indicator.classList.add('confidence-high');
    indicator.textContent = `✓ High (${(confidence * 100).toFixed(0)}%)`;
  } else if (level === 'medium') {
    indicator.classList.add('confidence-medium');
    indicator.textContent = `~ Medium (${(confidence * 100).toFixed(0)}%)`;
  } else {
    indicator.classList.add('confidence-low');
    indicator.textContent = `⚠ Low (${(confidence * 100).toFixed(0)}%)`;
  }
}

function showReviewWarning() {
  const warning = document.getElementById('reviewWarning');
  if (warning) warning.style.display = 'block';
}

function hideReviewWarning() {
  const warning = document.getElementById('reviewWarning');
  if (warning) warning.style.display = 'none';
}

function renderAttributes(attributes) {
  const container = document.getElementById('attributesContainer');
  if (!container) return;

  const entries = Object.entries(attributes);
  if (entries.length === 0) {
    container.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.875rem;">No attributes extracted</p>';
    return;
  }

  container.innerHTML = entries.map(([key, value]) => `
    <div class="attribute-row">
      <span class="attribute-key">${key}:</span>
      <span class="attribute-value">${value}</span>
    </div>
  `).join('');
}

function clearMetadata() {
  document.getElementById('metaType').value = 'uncategorized';
  updateSubtypeOptions('uncategorized');
  document.getElementById('metaSubtype').value = 'other';
  document.getElementById('metaTags').value = '';
  document.getElementById('attributesContainer').innerHTML = '';
  currentMetadata = null;
  updateConfidenceIndicator(1.0); // Manual entry
  hideReviewWarning();
  showToast('Metadata cleared', 'success');
}

function getCurrentConfidence() {
  return currentMetadata?.confidence || 1.0;
}

function collectAttributesFromForm() {
  // For now, return the stored attributes
  // Future: allow editing attributes in form
  return currentMetadata?.attributes || {};
}

// ============================================================================
// SEARCH & SCORING (Task 1.8)
// ============================================================================

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

  // Apply basic filters
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

  // Apply advanced filters (Phase 2)
  if (filters.advanced) {
    const adv = filters.advanced;

    // Camera filters
    if (adv.angle) {
      results = results.filter(p => p.metadata?.attributes?.angle === adv.angle);
    }
    if (adv.shot_type) {
      results = results.filter(p => p.metadata?.attributes?.shot_type === adv.shot_type);
    }
    if (adv.lens) {
      results = results.filter(p => p.metadata?.attributes?.lens === adv.lens);
    }

    // Subject filters
    if (adv.pose) {
      results = results.filter(p => {
        const promptPose = p.metadata?.attributes?.pose || '';
        return promptPose.toLowerCase().includes(adv.pose.toLowerCase());
      });
    }
    if (adv.orientation) {
      results = results.filter(p => p.metadata?.attributes?.orientation === adv.orientation);
    }
    if (adv.framing) {
      results = results.filter(p => p.metadata?.attributes?.framing === adv.framing);
    }

    // Setting filters
    if (adv.location) {
      results = results.filter(p => {
        const promptLocation = p.metadata?.attributes?.location || '';
        return promptLocation.toLowerCase().includes(adv.location.toLowerCase());
      });
    }
    if (adv.lighting) {
      results = results.filter(p => p.metadata?.attributes?.lighting === adv.lighting);
    }
    if (adv.time) {
      results = results.filter(p => p.metadata?.attributes?.time === adv.time);
    }
  }

  // Filter out zero scores (no match) - only if there's a query
  if (query && query.trim() !== '') {
    results = results.filter(r => r.score > 0);
  }

  // Sort by score DESC
  results.sort((a, b) => b.score - a.score);

  return results;
}

// ============================================================================
// FILTERING SYSTEM (Task 1.9 + Phase 2 Advanced Filters)
// ============================================================================

function applyFilters() {
  applyAdvancedFilters();
}

function applyAdvancedFilters() {
  const query = document.getElementById('searchInput')?.value || '';
  const typeFilter = document.getElementById('filterType')?.value || '';
  const activeTags = getActiveTagFilters();

  // Advanced filters (Phase 2)
  const advancedFilters = {
    // Camera filters
    angle: document.getElementById('filterAngle')?.value || '',
    shot_type: document.getElementById('filterShotType')?.value || '',
    lens: document.getElementById('filterLens')?.value || '',
    // Subject filters
    pose: document.getElementById('filterPose')?.value || '',
    orientation: document.getElementById('filterOrientation')?.value || '',
    framing: document.getElementById('filterFraming')?.value || '',
    // Setting filters
    location: document.getElementById('filterLocation')?.value || '',
    lighting: document.getElementById('filterLighting')?.value || '',
    time: document.getElementById('filterTime')?.value || ''
  };

  const filters = {
    type: typeFilter || undefined,
    tags: activeTags,
    advanced: advancedFilters
  };

  const results = searchPrompts(query, filters);
  renderPrompts(results);
  updateResultsCounter(results);
  updateClearFiltersButton();
}

function updateResultsCounter(results) {
  const counter = document.getElementById('resultsCounter');
  if (!counter) return;
  counter.textContent = `${results.length} of ${prompts.length} prompts`;
}

function updateClearFiltersButton() {
  const btn = document.getElementById('clearFiltersBtn');
  if (!btn) return;

  const hasFilters = hasActiveFilters();
  btn.style.display = hasFilters ? 'inline-flex' : 'none';
}

function hasActiveFilters() {
  // Check basic filters
  const typeFilter = document.getElementById('filterType')?.value || '';
  const query = document.getElementById('searchInput')?.value || '';
  const activeTags = getActiveTagFilters();

  if (typeFilter || query || activeTags.length > 0) return true;

  // Check advanced filters
  const advancedFilters = [
    'filterAngle', 'filterShotType', 'filterLens',
    'filterPose', 'filterOrientation', 'filterFraming',
    'filterLocation', 'filterLighting', 'filterTime'
  ];

  return advancedFilters.some(id => {
    const el = document.getElementById(id);
    return el && el.value && el.value.trim() !== '';
  });
}

function clearAllFilters() {
  // Clear basic filters
  const searchInput = document.getElementById('searchInput');
  const filterType = document.getElementById('filterType');
  if (searchInput) searchInput.value = '';
  if (filterType) filterType.value = '';

  // Clear tag filters
  document.querySelectorAll('.tag-pill.active').forEach(pill => {
    pill.classList.remove('active');
  });

  // Clear advanced filters
  const advancedFilters = [
    'filterAngle', 'filterShotType', 'filterLens',
    'filterPose', 'filterOrientation', 'filterFraming',
    'filterLocation', 'filterLighting', 'filterTime'
  ];

  advancedFilters.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  // Re-render
  renderPrompts();
  updateResultsCounter(prompts);
  updateClearFiltersButton();
  showToast('All filters cleared', 'success');
}

function toggleFilterSection(sectionId) {
  const content = document.getElementById(sectionId);
  const header = content?.parentElement;
  if (header) {
    header.classList.toggle('collapsed');
  }
}

function getActiveTagFilters() {
  return Array.from(document.querySelectorAll('.tag-pill.active'))
    .map(pill => pill.dataset.tag);
}

function renderTagFilters() {
  const container = document.getElementById('tagFilters');
  if (!container) return;

  // Extract all unique tags from prompts
  const allTags = new Set();
  prompts.forEach(p => {
    (p.metadata?.tags || []).forEach(tag => allTags.add(tag));
  });

  if (allTags.size === 0) {
    container.innerHTML = '';
  } else {
    container.innerHTML = Array.from(allTags).slice(0, 20).map(tag => `
      <span class="tag-pill" data-tag="${tag}" onclick="toggleTagFilter('${tag}')">
        ${tag}
      </span>
    `).join('');
  }

  // Populate location suggestions (Phase 2)
  populateLocationSuggestions();
}

function populateLocationSuggestions() {
  const container = document.getElementById('locationSuggestions');
  if (!container) return;

  const locations = new Set();
  prompts.forEach(p => {
    const location = p.metadata?.attributes?.location;
    if (location) locations.add(location);
  });

  if (locations.size === 0) {
    container.innerHTML = '';
  } else {
    container.innerHTML = Array.from(locations).map(loc =>
      `<option value="${loc}">`
    ).join('');
  }
}

function toggleTagFilter(tag) {
  const pill = document.querySelector(`[data-tag="${tag}"]`);
  if (pill) {
    pill.classList.toggle('active');
    applyFilters();
  }
}

// ============================================================================
// BACKWARD COMPATIBILITY (Task 1.7)
// ============================================================================

function migrateLegacyPrompt(prompt) {
  if (!prompt.schemaVersion || prompt.schemaVersion < 2) {
    // Old prompt without metadata
    return {
      ...prompt,
      schemaVersion: 2,
      metadata: {
        type: prompt.type || detectTypeFromContent(prompt.content) || 'uncategorized',
        subtype: prompt.subtype || 'other',
        tags: prompt.tags || [],
        confidence: 1.0, // Manual entry
        attributes: prompt.attributes || {}
      }
    };
  }
  return prompt;
}

function generateUniqueId() {
  return 'prompt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ============================================================================
// SAVE FUNCTION (Zero-Friction UX - Phase 1 Fix)
// ============================================================================

async function savePrompt() {
  const content = document.getElementById('promptContent').value;

  if (!content) {
    showToast('Please enter prompt content', 'error');
    return;
  }

  console.log('💾 [savePrompt] Starting save for content:', content.substring(0, 50) + '...');
  
  showLoading();
  try {
    // AI extracts EVERYTHING: title, description, metadata
    console.log('🔄 [savePrompt] Calling extractAllWithAI...');
    const extracted = await extractAllWithAI(content);
    console.log('✅ [savePrompt] Extracted data:', extracted);

    // Use extracted data (user can review/edit via metadata section if needed)
    // currentMetadata is already set from extraction for form display

    const prompt = {
      schemaVersion: 2,
      id: editingPromptId || generateUniqueId(),
      title: extracted.title,
      description: extracted.description,
      content,
      metadata: validateAndRepair(extracted.metadata),
      created: editingPromptId ? prompts.find(p => p.id === editingPromptId)?.created : new Date().toISOString(),
      updated: new Date().toISOString(),
      usage_count: editingPromptId ? (prompts.find(p => p.id === editingPromptId)?.usage_count || 0) : 0
    };

    console.log('💾 [savePrompt] Final prompt object:', prompt);

    // Validate before save (defense in depth)
    prompt.metadata = validateAndRepair(prompt.metadata);

    // Save to storage
    if (editingPromptId) {
      const index = prompts.findIndex(p => p.id === editingPromptId);
      prompts[index] = { ...prompts[index], ...prompt };
    } else {
      prompts.unshift(prompt);
    }

    console.log('💾 [savePrompt] Saving to Puter.kv...');
    await puter.kv.set('prompts', JSON.stringify(prompts));
    console.log('✅ [savePrompt] Saved successfully!');

    hidePromptModal();
    renderPrompts();
    renderTagFilters();
    showToast('Prompt saved successfully!', 'success');
  } catch (error) {
    console.error('❌ [savePrompt] ERROR:', error);
    showToast('Error saving prompt. Please try again.', 'error');
  } finally {
    hideLoading();
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

async function initApp() {
  showLoading();
  try {
    const storedPrompts = await puter.kv.get('prompts');
    if (storedPrompts) {
      prompts = JSON.parse(storedPrompts).map(migrateLegacyPrompt);
    }
    renderPrompts();
    renderTagFilters();
    updateResultsCounter(prompts);
    updateClearFiltersButton();
  } catch (error) {
    console.error('Error initializing app:', error);
    showToast('Error loading prompts', 'error');
  } finally {
    hideLoading();
  }
}

// ============================================================================
// RENDER PROMPTS
// ============================================================================

function renderPrompts(results = null) {
  const grid = document.getElementById('promptsGrid');
  if (!grid) {
    console.error('Error: promptsGrid element not found');
    return;
  }

  const dataToRender = results || prompts;

  grid.innerHTML = dataToRender.length > 0 ? dataToRender.map(prompt => {
    const metadata = prompt.metadata || {};
    const typeIcon = metadata.type === 'image' ? '📷' : metadata.type === 'video' ? '🎬' : metadata.type === 'code' ? '💻' : '❓';
    const tagsHtml = (metadata.tags || []).map(tag => `<span class="tag-badge">${tag}</span>`).join('');

    return `
      <div class="prompt-card">
        <div class="prompt-header">
          <div class="prompt-type-badge">${typeIcon} ${metadata.type || 'unknown'}</div>
          ${prompt.score !== undefined && prompt.score > 0 ? `<span class="score-badge">Score: ${prompt.score}</span>` : ''}
        </div>
        <div class="prompt-title">${prompt.title}</div>
        <div class="prompt-description">${prompt.description || ''}</div>
        <div class="prompt-content">${prompt.content}</div>
        <div class="prompt-tags">${tagsHtml}</div>
        <div class="card-actions">
          <button class="btn btn-secondary" onclick="copyPrompt('${prompt.id}')">Copy</button>
          <button class="btn btn-secondary" onclick="editPrompt('${prompt.id}')">Edit</button>
          <button class="btn btn-danger" onclick="deletePrompt('${prompt.id}')">Delete</button>
        </div>
      </div>
    `;
  }).join('') : '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">No prompts found</p>';
}

// ============================================================================
// PROMPT MANAGEMENT
// ============================================================================

async function deletePrompt(id) {
  if (!confirm('Are you sure you want to delete this prompt?')) return;

  showLoading();
  try {
    prompts = prompts.filter(p => p.id !== id);
    await puter.kv.set('prompts', JSON.stringify(prompts));
    renderPrompts();
    renderTagFilters();
    showToast('Prompt deleted successfully!', 'success');
  } catch (error) {
    console.error('Error deleting prompt:', error);
    showToast('Error deleting prompt. Please try again.', 'error');
  } finally {
    hideLoading();
  }
}

function editPrompt(id) {
  const prompt = prompts.find(p => p.id === id);
  if (!prompt) return;

  editingPromptId = id;
  currentMetadata = prompt.metadata || null;

  document.getElementById('modalTitle').textContent = 'Edit Prompt';
  
  const contentEl = document.getElementById('promptContent');
  if (contentEl) contentEl.value = prompt.content;

  // Show and populate metadata section for editing
  const metadataSection = document.getElementById('metadataExtraction');
  if (metadataSection) {
    metadataSection.style.display = 'block';
  }

  // Set metadata fields
  const metadata = prompt.metadata || {};
  
  const metaType = document.getElementById('metaType');
  if (metaType) {
    metaType.value = metadata.type || 'uncategorized';
    updateSubtypeOptions(metadata.type || 'uncategorized');
  }
  
  const metaSubtype = document.getElementById('metaSubtype');
  if (metaSubtype) metaSubtype.value = metadata.subtype || 'other';
  
  const metaTags = document.getElementById('metaTags');
  if (metaTags) metaTags.value = (metadata.tags || []).join(', ');
  
  renderAttributes(metadata.attributes || {});

  // Set confidence
  if (metadata.confidence) {
    updateConfidenceIndicator(metadata.confidence);
  }

  document.getElementById('promptModal').style.display = 'flex';
}

async function copyPrompt(id) {
  const prompt = prompts.find(p => p.id === id);
  if (!prompt) return;

  try {
    await navigator.clipboard.writeText(prompt.content);
    showToast('Prompt copied to clipboard!', 'success');
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    showToast('Error copying to clipboard. Please try again.', 'error');
  }
}

// ============================================================================
// MODAL MANAGEMENT (Zero-Friction UX)
// ============================================================================

function showAddPromptModal() {
  document.getElementById('modalTitle').textContent = 'Create New Prompt';
  document.getElementById('promptModal').style.display = 'flex';
  
  const contentEl = document.getElementById('promptContent');
  if (contentEl) contentEl.value = '';

  // Hide metadata section initially (will show after AI extraction on save)
  const metadataSection = document.getElementById('metadataExtraction');
  if (metadataSection) {
    metadataSection.style.display = 'none';
  }

  const metaType = document.getElementById('metaType');
  if (metaType) {
    metaType.value = 'uncategorized';
    updateSubtypeOptions('uncategorized');
  }
  
  const metaSubtype = document.getElementById('metaSubtype');
  if (metaSubtype) metaSubtype.value = 'other';
  
  const metaTags = document.getElementById('metaTags');
  if (metaTags) metaTags.value = '';
  
  const attrsContainer = document.getElementById('attributesContainer');
  if (attrsContainer) attrsContainer.innerHTML = '';
  
  editingPromptId = null;
  currentMetadata = null;
  updateConfidenceIndicator(1.0);
  hideReviewWarning();
}

function hidePromptModal() {
  document.getElementById('promptModal').style.display = 'none';
  improvedContent = null;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function showLoading() {
  document.getElementById('loading').style.display = 'flex';
}

function hideLoading() {
  document.getElementById('loading').style.display = 'none';
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.style.background = type === 'success' ? 'var(--success)' : 'var(--danger)';
  toast.style.display = 'block';
  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Search input
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', () => applyFilters());
  }

  // Type filter
  const filterType = document.getElementById('filterType');
  if (filterType) {
    filterType.addEventListener('change', () => applyFilters());
  }

  // Navigation
  const nav = document.querySelector('nav');
  if (nav) {
    nav.addEventListener('click', (e) => {
      if (e.target.classList.contains('nav-item')) {
        document.querySelectorAll('.nav-item').forEach(item => {
          item.classList.remove('active');
        });
        e.target.classList.add('active');
        currentCategory = e.target.dataset.category;

        // Filter by category (legacy support)
        if (currentCategory === 'all') {
          renderPrompts();
        } else {
          const filtered = prompts.filter(p => p.category === currentCategory);
          renderPrompts(filtered);
        }
      }
    });
  }

  // Type select change - update subtypes
  const metaType = document.getElementById('metaType');
  if (metaType) {
    metaType.addEventListener('change', (e) => {
      updateSubtypeOptions(e.target.value);
    });
  }
});

// Initialize the app
document.addEventListener('DOMContentLoaded', initApp);

// ============================================================================
// TEST SUITE (Task 1.11)
// ============================================================================

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
  {
    content: "Product photography of a watch on white background, studio lighting",
    expectedType: 'image',
    expectedSubtype: 'product',
    expectedTags: ['product', 'studio lighting']
  },
  {
    content: "Macro shot of a butterfly on a flower, extreme closeup",
    expectedType: 'image',
    expectedSubtype: 'macro',
    expectedTags: ['macro', 'butterfly', 'nature']
  },
  {
    content: "Street photography in Tokyo at night, neon lights, rainy streets",
    expectedType: 'image',
    expectedSubtype: 'street',
    expectedTags: ['street', 'night', 'tokyo']
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
  {
    content: "Write a SQL query to get all users who ordered in the last 30 days",
    expectedType: 'code',
    expectedSubtype: 'query',
    expectedTags: ['sql', 'query', 'database']
  },
  {
    content: "Create a Node.js Express API endpoint for user authentication",
    expectedType: 'code',
    expectedSubtype: 'api',
    expectedTags: ['nodejs', 'express', 'api', 'authentication']
  },
  {
    content: "Write a bash script to backup files to a remote server",
    expectedType: 'code',
    expectedSubtype: 'script',
    expectedTags: ['bash', 'script', 'backup']
  },
  // Video prompts
  {
    content: "A timelapse video of a sunset over the mountains, clouds moving quickly",
    expectedType: 'video',
    expectedSubtype: 'timelapse',
    expectedTags: ['timelapse', 'sunset', 'mountains']
  },
  {
    content: "Interview setup with soft lighting, two people talking",
    expectedType: 'video',
    expectedSubtype: 'interview',
    expectedTags: ['interview', 'lighting']
  },
  {
    content: "B-roll footage of someone typing on a laptop in a coffee shop",
    expectedType: 'video',
    expectedSubtype: 'b-roll',
    expectedTags: ['b-roll', 'coffee shop', 'laptop']
  },
  {
    content: "Tutorial video showing how to use Photoshop layers",
    expectedType: 'video',
    expectedSubtype: 'tutorial',
    expectedTags: ['tutorial', 'photoshop']
  },
  // Ambiguous prompts
  {
    content: "Create something beautiful",
    expectedType: 'uncategorized',
    expectedSubtype: 'other',
    expectedTags: []
  },
  {
    content: "Hello world",
    expectedType: 'uncategorized',
    expectedSubtype: 'other',
    expectedTags: []
  }
];

async function runTestSuite() {
  let passed = 0;
  let failed = 0;

  console.log('=== Running Test Suite ===\n');

  for (let index = 0; index < TEST_PROMPTS.length; index++) {
    const test = TEST_PROMPTS[index];
    try {
      const result = await extractMetadataWithFallback(test.content, '', '');
      const typeMatch = result.type === test.expectedType;
      const subtypeMatch = result.subtype === test.expectedSubtype;

      if (typeMatch && subtypeMatch) {
        passed++;
        console.log(`✅ Test ${index + 1}: PASS (${result.type}/${result.subtype})`);
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
  }

  const accuracy = (passed / TEST_PROMPTS.length) * 100;
  console.log('\n=== Test Results ===');
  console.log(`Passed: ${passed}/${TEST_PROMPTS.length}`);
  console.log(`Accuracy: ${accuracy.toFixed(1)}%`);
  console.log(`Target: 70-80%`);

  return { passed, failed, accuracy };
}

// Export for console testing
window.runTestSuite = runTestSuite;
window.normalizeAIResponse = normalizeAIResponse;
window.validateAndRepair = validateAndRepair;
window.METADATA_SCHEMA = METADATA_SCHEMA;
window.SUBTYPE_REGISTRY = SUBTYPE_REGISTRY;
window.TAG_SYNONYMS = TAG_SYNONYMS;
window.extractAllWithAI = extractAllWithAI; // NEW: Export for testing
