# Phase 2 Plan: Advanced Search & Filtering

**Phase Number:** 2  
**Goal:** Implementar búsquedas por metadatos y filtros avanzados  
**Estimated Time:** 15 horas  
**Status:** Ready to Execute  

---

## Context

Phase 1 completed the foundation with:
- Metadata schema v2 (camera, subject, setting)
- AI categorization and extraction
- Basic search with weighted scoring
- Basic type filter and tag pills

Phase 2 builds on this by adding:
- Advanced filtering UI (sidebar/toolbar)
- Filter by all metadata fields
- Combined filters logic
- Real-time search with filters
- Results counter

---

## Requirements Mapping

| Requirement | Phase 2 Tasks |
|-------------|---------------|
| FR-5.2 | Filter by type (already partially done, needs polish) |
| FR-5.3 | Filter by subtype |
| FR-5.4 | Filter by tags (already partially done, needs enhancement) |
| FR-5.5 | Filter by camera metadata (angle, shot_type, lens) |
| FR-5.6 | Filter by subject metadata (pose, orientation, framing) |
| FR-5.7 | Filter by setting metadata (location, lighting, time) |
| FR-5.8 | Combined filters |
| FR-5.9 | Search results count |
| FR-7.3 | Sidebar de navegación con categorías |

---

## Tasks

### Task 2.1: Advanced Search UI Component
**Description:** Create sidebar or toolbar component with advanced filter controls  
**Dependencies:** None  
**Estimate:** 2h  

**Subtasks:**
- [ ] Design filter UI layout (sidebar vs toolbar)
- [ ] Create collapsible filter sections
- [ ] Add filter controls: dropdowns, checkboxes, text inputs
- [ ] Style to match existing dark theme
- [ ] Make responsive for mobile

**Acceptance Criteria:**
- Filter UI visible and accessible
- All filter sections collapsible
- Consistent with Phase 1 design

---

### Task 2.2: Type & Subtype Filter
**Description:** Implement filtering by type (image/video/code) and subtype  
**Dependencies:** 2.1  
**Estimate:** 1h  

**Subtasks:**
- [ ] Create type filter dropdown (All, Image, Video, Code)
- [ ] Create dynamic subtype filter based on type selection
- [ ] Implement filter logic in search function
- [ ] Update filter state management

**Acceptance Criteria:**
- User can filter by type
- Subtype options update based on type
- Filter applies correctly to results

---

### Task 2.3: Tag Filter Enhancement
**Description:** Enhance tag filtering with multi-select and suggestions  
**Dependencies:** 2.1  
**Estimate:** 2h  

**Subtasks:**
- [ ] Convert tag pills to multi-select
- [ ] Add tag search/input field
- [ ] Show most used tags first
- [ ] Implement AND/OR logic for multiple tags
- [ ] Update existing tag pill display

**Acceptance Criteria:**
- User can select multiple tags
- Tag suggestions appear while typing
- Multiple tags filter correctly

---

### Task 2.4: Camera Metadata Filters
**Description:** Filter by camera-related metadata fields  
**Dependencies:** 2.1  
**Estimate:** 2h  

**Subtasks:**
- [ ] Add angle filter (dropdown: high-angle, low-angle, eye-level, etc.)
- [ ] Add shot_type filter (dropdown: close-up, medium, long, etc.)
- [ ] Add lens filter (dropdown: wide-angle, telephoto, macro, etc.)
- [ ] Implement filter logic for camera fields
- [ ] Show only available values in dropdowns

**Acceptance Criteria:**
- All camera fields filterable
- Dropdowns show only values present in data
- Filters combine correctly

---

### Task 2.5: Subject Metadata Filters
**Description:** Filter by subject-related metadata fields  
**Dependencies:** 2.1  
**Estimate:** 2h  

**Subtasks:**
- [ ] Add pose filter (text input or dropdown)
- [ ] Add orientation filter (dropdown: facing camera, profile, back, etc.)
- [ ] Add framing filter (dropdown: headshot, three-quarter, full-body, etc.)
- [ ] Implement filter logic for subject fields
- [ ] Show only available values

**Acceptance Criteria:**
- All subject fields filterable
- Filters work independently and combined
- UI shows active filters clearly

---

### Task 2.6: Setting Metadata Filters
**Description:** Filter by environment/setting metadata fields  
**Dependencies:** 2.1  
**Estimate:** 1h  

**Subtasks:**
- [ ] Add location filter (text input with suggestions)
- [ ] Add lighting filter (dropdown: natural, studio, golden-hour, etc.)
- [ ] Add time filter (dropdown: morning, afternoon, evening, night, etc.)
- [ ] Implement filter logic for setting fields

**Acceptance Criteria:**
- All setting fields filterable
- Text input has autocomplete from existing values
- Filters apply correctly

---

### Task 2.7: Combined Filters Logic
**Description:** Enable multiple filters to work simultaneously  
**Dependencies:** 2.2, 2.3, 2.4, 2.5, 2.6  
**Estimate:** 2h  

**Subtasks:**
- [ ] Create unified filter state object
- [ ] Implement AND logic across different filter categories
- [ ] Implement OR logic within same category (e.g., multiple tags)
- [ ] Optimize filter performance for large datasets
- [ ] Add filter state persistence (optional)

**Acceptance Criteria:**
- All filters can be active simultaneously
- Results update in real-time
- No performance degradation

---

### Task 2.8: Search Results Counter
**Description:** Display number of matching results  
**Dependencies:** 2.7  
**Estimate:** 0.5h  

**Subtasks:**
- [ ] Add results count display near search bar
- [ ] Update count on every filter/search change
- [ ] Show "X of Y prompts" format
- [ ] Style to match existing UI

**Acceptance Criteria:**
- Count updates in real-time
- Format is clear and readable
- Shows total when no filters active

---

### Task 2.9: Clear Filters Control
**Description:** Add button to reset all filters at once  
**Dependencies:** 2.1  
**Estimate:** 0.5h  

**Subtasks:**
- [ ] Add "Clear All Filters" button
- [ ] Show button only when filters are active
- [ ] Reset all filter state to default
- [ ] Add visual indicator of active filter count

**Acceptance Criteria:**
- Button appears when filters active
- Click resets all filters
- Search results update immediately

---

### Task 2.10: Testing & Polish
**Description:** Test all filter combinations and edge cases  
**Dependencies:** 2.7, 2.8, 2.9  
**Estimate:** 2h  

**Subtasks:**
- [ ] Test individual filters
- [ ] Test all filter combinations
- [ ] Test with empty results
- [ ] Test with large dataset
- [ ] Test mobile responsiveness
- [ ] Fix any bugs found
- [ ] Add keyboard navigation (optional)

**Acceptance Criteria:**
- All filters work correctly
- No console errors
- Mobile UI functional
- Performance acceptable

---

## Deliverables

- [ ] Sidebar or toolbar with advanced filters (type, subtype, tags, camera, subject, setting)
- [ ] Real-time search combining text + filters
- [ ] Results counter showing "X of Y prompts"
- [ ] Clear All Filters button
- [ ] Active filter indicators
- [ ] Mobile-responsive filter UI

---

## Success Criteria

| Criterion | Measurement |
|-----------|-------------|
| Find prompts by any metadata | User can filter by any field in metadata schema |
| Combinable filters | No errors when combining 5+ filters |
| UI responsive | Filter UI works on mobile, tablet, desktop |
| Performance | Filters update in < 100ms for 100 prompts |
| Real-time updates | Results update as filters change (no button needed) |

---

## Technical Notes

### Filter State Management
```javascript
// Example filter state structure
const filterState = {
  search: '', // text search
  type: null, // 'image' | 'video' | 'code' | null
  subtype: null, // dynamic based on type
  tags: [], // array of selected tags
  camera: {
    angle: null,
    shot_type: null,
    lens: null
  },
  subject: {
    pose: null,
    orientation: null,
    framing: null
  },
  setting: {
    location: null,
    lighting: null,
    time: null
  }
};
```

### Filter Logic
- Different categories use AND logic
- Same category uses OR logic (e.g., multiple tags)
- Empty/null filters are ignored
- Text search is combined with filters (AND)

### Performance Considerations
- Debounce text input (200ms)
- Cache filtered results if needed
- Use efficient array methods (some, every, filter)
- Consider virtual scrolling if > 100 prompts

---

## Dependencies

**External:**
- Phase 1 completion (metadata schema, search engine)
- Puter.kv for data storage

**Internal:**
- Task 2.1 is prerequisite for 2.2-2.6
- Task 2.7 requires 2.2-2.6 completion
- Task 2.8-2.9 require 2.7

---

## Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Too many filter options overwhelm UI | Medium | Medium | Use collapsible sections, progressive disclosure |
| Performance issues with many prompts | Medium | Low | Implement debouncing, optimize filter logic |
| Mobile UI cramped | Low | Medium | Use accordions, prioritize most-used filters |
| Filter state management complex | Medium | Medium | Use centralized state object, clear update functions |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/index.html` | Add filter UI components |
| `src/style.css` | Add filter styles, responsive rules |
| `src/main.js` | Add filter state, logic, event handlers |

---

## Definition of Done

- [ ] All 10 tasks completed
- [ ] All acceptance criteria met
- [ ] Tested with real data
- [ ] Mobile responsive verified
- [ ] No console errors
- [ ] Code reviewed (self)
- [ ] Committed with clear message

---

**Created:** 2026-03-28  
**Phase:** 2  
**Next:** Execute tasks → Verify → `/gsd:verify-phase 2`
