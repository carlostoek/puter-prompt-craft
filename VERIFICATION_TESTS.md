# Phase 1 Verification Tests

Run these tests in the browser console after loading the application.

## Schema Verification

```javascript
console.log('=== Schema Verification ===');
console.log('Schema version:', METADATA_SCHEMA.schemaVersion);
console.log('Expected: 2');
console.log('Subtypes for image:', SUBTYPE_REGISTRY.image);
console.log('Tag synonyms:', TAG_SYNONYMS);
```

## Normalization Tests

```javascript
console.log('=== Normalization Tests ===');

// Test 1: String to array conversion
const normalized1 = normalizeAIResponse('{"type": "image", "tags": "portrait, sexy"}');
console.log('Test 1 - String tags to array:', normalized1.tags);
console.log('Expected: ["portrait", "sexy"]');

// Test 2: Markdown stripping
const normalized2 = normalizeAIResponse('```json\n{"type": "video"}\n```');
console.log('Test 2 - Markdown stripped:', normalized2.type);
console.log('Expected: "video"');

// Test 3: Default values
const normalized3 = normalizeAIResponse('{"type": "image"}');
console.log('Test 3 - Default subtype:', normalized3.subtype);
console.log('Expected: "other"');
console.log('Test 3 - Default confidence:', normalized3.confidence);
console.log('Expected: 0.5');
```

## Validation Tests

```javascript
console.log('=== Validation Tests ===');

const invalid = {
  type: 'photo', // invalid
  subtype: 'portraits', // not in registry
  tags: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'], // 10 tags
  confidence: 1.5, // out of range
  unknownField: 'should be removed'
};

const repaired = validateAndRepair(invalid);
console.log('Repaired type:', repaired.type);
console.log('Expected: "uncategorized"');
console.log('Repaired subtype:', repaired.subtype);
console.log('Expected: "other"');
console.log('Repaired tags count:', repaired.tags.length);
console.log('Expected: 8 (max)');
console.log('Repaired confidence:', repaired.confidence);
console.log('Expected: 0.5 (clamped)');
console.log('Has unknownField?', 'unknownField' in repaired);
console.log('Expected: false');
```

## Tag Normalization Tests

```javascript
console.log('=== Tag Normalization Tests ===');

const tags = ['Portrait', 'portrait', '  HEADSHOT  ', 'landscape'];
console.log('Deduped:', deduplicateTags(tags));
console.log('Expected: ["portrait", "headshot", "landscape"]');

console.log('Expanded:', expandTagsWithSynonyms(['headshot']));
console.log('Expected: ["headshot", "portrait"]');
```

## Hash Consistency Test

```javascript
console.log('=== Hash Consistency Test ===');

const hash1 = hashPrompt("test content");
const hash2 = hashPrompt("test content");
console.log('Hash consistency:', hash1 === hash2);
console.log('Expected: true');
```

## Full Integration Test

```javascript
console.log('=== Full Integration Test ===');

async function testFullFlow() {
  const testContent = "A portrait shot of a woman in golden hour lighting, soft natural light";
  
  try {
    const result = await extractMetadataWithFallback(testContent, "Golden Hour Portrait", "");
    console.log('Full extraction result:', result);
    console.log('Type:', result.type);
    console.log('Expected type: "image"');
    console.log('Tags:', result.tags);
    console.log('Confidence:', result.confidence);
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testFullFlow();
```

## Search Scoring Test

```javascript
console.log('=== Search Scoring Test ===');

// Create a test prompt
const testPrompt = {
  title: "Golden Hour Portrait",
  description: "Beautiful portrait in natural lighting",
  content: "A portrait shot during golden hour",
  metadata: {
    type: "image",
    subtype: "portrait",
    tags: ["portrait", "golden hour", "natural lighting"]
  }
};

const score1 = scorePrompt(testPrompt, "portrait");
console.log('Score for "portrait":', score1);
console.log('Expected: > 0 (title + tags match)');

const score2 = scorePrompt(testPrompt, "golden hour");
console.log('Score for "golden hour":', score2);
console.log('Expected: > 0 (content + tags match)');

const score3 = scorePrompt(testPrompt, "random");
console.log('Score for "random":', score3);
console.log('Expected: 0 (no match)');
```

## Run Full Test Suite

```javascript
console.log('=== Running Full Test Suite ===');
runTestSuite();
```

## Expected Results

- **Schema version**: 2
- **Normalization**: Handles malformed JSON, strips markdown, sets defaults
- **Validation**: Repairs invalid types, clamps values, removes unknown fields
- **Tags**: Deduplicated, lowercase, max 8
- **Hash**: Consistent for same input
- **Search**: Weighted scoring works correctly
- **Test Suite Accuracy**: Target 70-80%

## Manual UI Tests

1. **Create a new prompt**
   - Click "New Prompt"
   - Enter title, description, and content
   - Click "Extract Metadata"
   - Verify: Fields populate automatically
   - Verify: Confidence indicator shows correct color
   - Verify: All fields are editable

2. **Test filters**
   - Create multiple prompts with different types
   - Use type filter dropdown
   - Click tag pills
   - Verify: Results update correctly

3. **Test search**
   - Enter search query
   - Verify: Results sorted by relevance score
   - Verify: Score badges show on cards
