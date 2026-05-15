#!/usr/bin/env bash
# Sprint 3 GitHub Issue Creation Script
# Repo: lukesydow-lab/DAWin
#
# Usage:
#   export GITHUB_TOKEN=ghp_your_token_here
#   bash docs/features/CREATE-ISSUES.sh
#
# The script will:
#   1. Find the Sprint 3 milestone ID
#   2. Confirm which labels exist
#   3. Create all 6 Sprint 3 issues
#   4. Print issue numbers and URLs as it goes

set -euo pipefail

REPO="lukesydow-lab/DAWin"
API="https://api.github.com"
AUTH="Authorization: Bearer ${GITHUB_TOKEN:?Please export GITHUB_TOKEN}"
ACCEPT="Accept: application/vnd.github+json"

echo "=== Checking authentication ==="
curl -sf "$API/user" -H "$AUTH" -H "$ACCEPT" | python3 -c "import sys,json; u=json.load(sys.stdin); print('Authenticated as:', u['login'])"

echo ""
echo "=== Finding Sprint 3 milestone ==="
MILESTONE_ID=$(curl -sf "$API/repos/$REPO/milestones?state=all&per_page=100" \
  -H "$AUTH" -H "$ACCEPT" | \
  python3 -c "
import sys, json
milestones = json.load(sys.stdin)
for m in milestones:
    if 'sprint 3' in m['title'].lower() or 'sprint3' in m['title'].lower() or m['title'] == '3':
        print(m['number'])
        break
else:
    print('NOT_FOUND')
")

if [ "$MILESTONE_ID" = "NOT_FOUND" ]; then
  echo "WARNING: No 'Sprint 3' milestone found. Issues will be created without a milestone."
  echo "Available milestones:"
  curl -sf "$API/repos/$REPO/milestones?state=all&per_page=100" \
    -H "$AUTH" -H "$ACCEPT" | \
    python3 -c "import sys,json; [print(f\"  #{m['number']}: {m['title']}\") for m in json.load(sys.stdin)]"
  MILESTONE_PARAM="null"
else
  echo "Found Sprint 3 milestone: #$MILESTONE_ID"
  MILESTONE_PARAM="$MILESTONE_ID"
fi

echo ""
echo "=== Checking existing labels ==="
ALL_LABELS=$(curl -sf "$API/repos/$REPO/labels?per_page=100" \
  -H "$AUTH" -H "$ACCEPT" | \
  python3 -c "import sys,json; [print(l['name']) for l in json.load(sys.stdin)]")
echo "Existing labels:"
echo "$ALL_LABELS" | sed 's/^/  /'

# Helper: build milestone JSON fragment
if [ "$MILESTONE_PARAM" = "null" ]; then
  MILESTONE_JSON="null"
else
  MILESTONE_JSON="$MILESTONE_PARAM"
fi

# Helper function to create an issue and print its URL
create_issue() {
  local title="$1"
  local body="$2"
  local labels_json="$3"

  if [ "$MILESTONE_PARAM" = "null" ]; then
    payload=$(python3 -c "
import json, sys
print(json.dumps({
  'title': sys.argv[1],
  'body': sys.argv[2],
  'labels': json.loads(sys.argv[3])
}))
" "$title" "$body" "$labels_json")
  else
    payload=$(python3 -c "
import json, sys
print(json.dumps({
  'title': sys.argv[1],
  'body': sys.argv[2],
  'labels': json.loads(sys.argv[3]),
  'milestone': int(sys.argv[4])
}))
" "$title" "$body" "$labels_json" "$MILESTONE_PARAM")
  fi

  response=$(curl -sf -X POST "$API/repos/$REPO/issues" \
    -H "$AUTH" -H "$ACCEPT" \
    -H "Content-Type: application/json" \
    -d "$payload")

  issue_num=$(echo "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['number'])")
  issue_url=$(echo "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['html_url'])")
  echo "  Created #$issue_num: $issue_url"
  echo "$issue_num $issue_url"
}

echo ""
echo "=== Creating Sprint 3 Issues ==="

# -----------------------------------------------------------------------
# Issue 1: Tech Lead — Zoom + Panel Architecture Decision
# -----------------------------------------------------------------------
echo ""
echo "Creating Issue 1: Tech Lead architecture decisions..."
ISSUE1_RESULT=$(create_issue \
  "[Tech Lead] Sprint 3 architecture decisions — zoom state model and panel persistence" \
  "## Sprint 3 Architecture Decisions Required

Before Frontend can begin FR-01 (Resizable Panels) or FR-02 (Arranger Zoom), the Tech Lead must document decisions on:

### Decision 1 — Panel size persistence
Should resizable panel sizes persist to \`localStorage\` between sessions, or remain in-memory only (reset on reload)?

- **Option A:** In-memory \`useState\` only — simpler, no storage risk
- **Option B:** \`localStorage\` with a versioned key — better UX, trivial to implement, but establishes a client-storage precedent

**Recommendation:** Start with Option A. localStorage can be added in a follow-up once the resize UX is validated.

### Decision 2 — Zoom state scope
Should \`zoomX\` (horizontal timeline zoom) and per-track \`zoomY\` (vertical track zoom) be:

- **Option A:** Local React state only, never synced to other clients
- **Option B:** Eventually part of collaborative session state (each user has their own view state, server is not authoritative for zoom)

**Recommendation:** Option A for now — zoom is a view preference, not session state. Document this as a non-collaborative view property.

### Decision 3 — BAR_W/TRACK_H abstraction
The current \`BAR_W = 72\` and \`TRACK_H = 64\` are module-level constants referenced in ~40+ places. The zoom feature needs derived values (\`barW = BAR_W * zoomX\`). What is the right abstraction?

- **Option A:** Pass \`barW\` and \`trackH\` as props down the component tree — explicit but verbose
- **Option B:** React context for zoom values — cleaner for deeply nested components
- **Option C:** Module-level mutable refs (like \`_audioCtx\`) — not recommended for UI values

**Recommendation:** Option A (props) for now given single-file constraint. If component tree grows, migrate to context.

### Deliverable
Document decisions as a comment on this issue and as an inline note in the relevant spec files (\`docs/specs/arranger-zoom.md\`, \`docs/specs/resizable-workspace-panels.md\`).

**References:** FR-01 (\`docs/features/FR-2026-05-14-01-resizable-workspace-panels.md\`), FR-02 (\`docs/features/FR-2026-05-14-02-multitrack-horizontal-vertical-zoom.md\`)" \
  '["sprint:3","priority:p1"]'
)
ISSUE1_NUM=$(echo "$ISSUE1_RESULT" | tail -1 | awk '{print $1}')
ISSUE1_URL=$(echo "$ISSUE1_RESULT" | tail -1 | awk '{print $2}')

# -----------------------------------------------------------------------
# Issue 2: Designer — Arranger Zoom Interaction Spec
# -----------------------------------------------------------------------
echo ""
echo "Creating Issue 2: Designer zoom interaction spec..."
ISSUE2_RESULT=$(create_issue \
  "[Designer] Arranger zoom — keyboard shortcut research and interaction spec" \
  "## Arranger Zoom Interaction Spec

The Frontend Engineer cannot start zoom implementation without confirmed keyboard/mouse shortcut standards. This ticket requires the Designer to research DAW conventions and write the Interaction Model section of \`docs/specs/arranger-zoom.md\`.

### Research required

Review zoom interaction in at minimum:
- Ableton Live 11/12
- Logic Pro X
- Pro Tools
- Reaper

For each, document:
- Horizontal zoom in/out shortcut
- Whether zoom centers on playhead, cursor, or left edge
- Vertical track height control
- Zoom reset shortcut

### Output

Complete the \`### Interaction Model\` section in \`docs/specs/arranger-zoom.md\` with:
1. Confirmed horizontal zoom shortcuts (keyboard + scroll modifier)
2. Vertical zoom control per track
3. Zoom reset command
4. Where zoom anchors (playhead position should be preserved in view after zoom)
5. Zoom level indicator placement and format

**Blocked by:** Nothing — can start immediately
**Blocks:** Issue [Frontend horizontal zoom implementation]

**References:** FR-02 (\`docs/features/FR-2026-05-14-02-multitrack-horizontal-vertical-zoom.md\`), spec: \`docs/specs/arranger-zoom.md\`" \
  '["sprint:3","priority:p1"]'
)
ISSUE2_NUM=$(echo "$ISSUE2_RESULT" | tail -1 | awk '{print $1}')
ISSUE2_URL=$(echo "$ISSUE2_RESULT" | tail -1 | awk '{print $2}')

# -----------------------------------------------------------------------
# Issue 3: Frontend — Resizable Workspace Panels
# -----------------------------------------------------------------------
echo ""
echo "Creating Issue 3: Frontend resizable panels..."
ISSUE3_RESULT=$(create_issue \
  "[Frontend] Resizable workspace panels — arranger/mixer splitter + FX panel width" \
  "## Resizable Workspace Panels

Implement FR-01. Add draggable splitters between the arranger and mixer (vertical resize) and between the main workspace and FX panel (horizontal resize).

**Spec:** \`docs/specs/resizable-workspace-panels.md\`
**FR:** \`docs/features/FR-2026-05-14-01-resizable-workspace-panels.md\`

### Summary of work
- Draggable splitter between arranger and mixer (row-resize cursor)
- Draggable splitter between workspace and FX panel (col-resize cursor)
- Min/max constraints on all panels
- Double-click reset to default sizes
- \`role=\"separator\"\` ARIA on splitters
- No localStorage persistence (in-memory only for Sprint 3)

### Must not break
- Clip drag/resize/fade math
- VU meter rAF loop
- FX panel \`position:fixed\` anchoring (the \`overflow:clip\` BFC fix in App.css)
- \`tsc --noEmit --noUnusedLocals --noUnusedParameters\` must pass

**Blocked by:** Tech Lead architecture decision issue #${ISSUE1_NUM}
**Estimate:** M (2–6h)" \
  '["sprint:3","component:frontend","priority:p1","type:feature-request"]'
)
ISSUE3_NUM=$(echo "$ISSUE3_RESULT" | tail -1 | awk '{print $1}')
ISSUE3_URL=$(echo "$ISSUE3_RESULT" | tail -1 | awk '{print $2}')

# -----------------------------------------------------------------------
# Issue 4: Frontend — Horizontal Timeline Zoom
# -----------------------------------------------------------------------
echo ""
echo "Creating Issue 4: Frontend horizontal zoom..."
ISSUE4_RESULT=$(create_issue \
  "[Frontend] Arranger horizontal zoom — zoom-aware BAR_W and clip math" \
  "## Horizontal Timeline Zoom

Implement FR-02 horizontal axis. Convert \`BAR_W\` from a fixed constant into a zoom-aware derived value \`barW = BAR_W * zoomX\` where \`zoomX\` is React state (default 1.0, min 0.25, max 4.0).

**Spec:** \`docs/specs/arranger-zoom.md\`
**FR:** \`docs/features/FR-2026-05-14-02-multitrack-horizontal-vertical-zoom.md\`

### What must update when zoomX changes
- Clip x position and width
- Resize handle positions
- Fade handle positions and drag math
- Ruler tick spacing and bar labels
- Playhead x position
- Crossfade zone width
- Scroll position (preserve playhead in view after zoom change)
- Arranger canvas total width

### Must not break
- Clip drag (bar-snapped, grab-offset correct)
- Ruler click seek
- Cut tool hit detection
- Fade/crossfade drag math
- All existing keyboard shortcuts

**Blocked by:** Tech Lead architecture issue #${ISSUE1_NUM} + Designer shortcut spec #${ISSUE2_NUM}
**Estimate:** L (6–16h)" \
  '["sprint:3","component:frontend","priority:p1","type:feature-request"]'
)
ISSUE4_NUM=$(echo "$ISSUE4_RESULT" | tail -1 | awk '{print $1}')
ISSUE4_URL=$(echo "$ISSUE4_RESULT" | tail -1 | awk '{print $2}')

# -----------------------------------------------------------------------
# Issue 5: Frontend — Per-Track Vertical Zoom
# -----------------------------------------------------------------------
echo ""
echo "Creating Issue 5: Frontend vertical zoom..."
ISSUE5_RESULT=$(create_issue \
  "[Frontend] Arranger per-track vertical zoom — zoom-aware TRACK_H" \
  "## Per-Track Vertical Zoom

Implement FR-02 vertical axis. Replace global \`TRACK_H\` with per-track zoom state \`trackZoomY: Record<trackId, number>\` where each track derives its height as \`TRACK_H * trackZoomY[id]\` (default 1.0, min 0.5, max 3.0).

**Spec:** \`docs/specs/arranger-zoom.md\`
**FR:** \`docs/features/FR-2026-05-14-02-multitrack-horizontal-vertical-zoom.md\`

### Key constraints
- Mixer strip height does NOT change with vertical zoom — mixer and arranger track heights are decoupled
- Clip height follows track height
- Fade handle y-range follows track height
- VU meters are unaffected

**Blocked by:** Horizontal zoom implementation #${ISSUE4_NUM}
**Estimate:** M (2–6h)" \
  '["sprint:3","component:frontend","priority:p2","type:feature-request"]'
)
ISSUE5_NUM=$(echo "$ISSUE5_RESULT" | tail -1 | awk '{print $1}')
ISSUE5_URL=$(echo "$ISSUE5_RESULT" | tail -1 | awk '{print $2}')

# -----------------------------------------------------------------------
# Issue 6: UAT — Sprint 3 acceptance testing
# -----------------------------------------------------------------------
echo ""
echo "Creating Issue 6: UAT Sprint 3..."
ISSUE6_RESULT=$(create_issue \
  "[UAT] Sprint 3 acceptance testing — resizable panels + zoom" \
  "## Sprint 3 UAT

Run acceptance testing after resizable panels and arranger zoom are implemented. Validate all exit criteria in \`docs/specs/resizable-workspace-panels.md\` and \`docs/specs/arranger-zoom.md\`.

### Test scenarios
1. Drag arranger/mixer splitter — verify resize is smooth, min/max enforced, clip/VU behavior preserved
2. Drag FX panel splitter — verify panel resizes, position:fixed anchoring not broken
3. Double-click splitter — verify reset to default size
4. Horizontal zoom in/out — verify all arranger elements scale correctly
5. Horizontal zoom + clip drag — verify bar-snapping still works at non-default zoom
6. Horizontal zoom + ruler seek — verify playhead lands correctly
7. Per-track vertical zoom — verify mixer strip height unchanged
8. Zoom at min/max bounds — verify no layout collapse

Log any defects to \`docs/defects.md\` with priority and file:line.

**Blocked by:** All Sprint 3 implementation issues (#${ISSUE3_NUM}, #${ISSUE4_NUM}, #${ISSUE5_NUM})" \
  '["sprint:3","priority:p1"]'
)
ISSUE6_NUM=$(echo "$ISSUE6_RESULT" | tail -1 | awk '{print $1}')
ISSUE6_URL=$(echo "$ISSUE6_RESULT" | tail -1 | awk '{print $2}')

# -----------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------
echo ""
echo "=== All Sprint 3 Issues Created ==="
echo ""
echo "| # | Title | URL |"
echo "|---|-------|-----|"
echo "| #$ISSUE1_NUM | [Tech Lead] Sprint 3 architecture decisions | $ISSUE1_URL |"
echo "| #$ISSUE2_NUM | [Designer] Arranger zoom interaction spec | $ISSUE2_URL |"
echo "| #$ISSUE3_NUM | [Frontend] Resizable workspace panels | $ISSUE3_URL |"
echo "| #$ISSUE4_NUM | [Frontend] Arranger horizontal zoom | $ISSUE4_URL |"
echo "| #$ISSUE5_NUM | [Frontend] Arranger per-track vertical zoom | $ISSUE5_URL |"
echo "| #$ISSUE6_NUM | [UAT] Sprint 3 acceptance testing | $ISSUE6_URL |"

echo ""
echo "Note: Labels 'component:tech-lead', 'component:design', 'component:uat' may not exist."
echo "If you see label errors, create them first:"
echo ""
echo "  # Create missing labels"
echo "  for label in 'component:tech-lead' 'component:design' 'component:uat'; do"
echo "    curl -s -X POST https://api.github.com/repos/$REPO/labels \\"
echo "      -H \"Authorization: Bearer \$GITHUB_TOKEN\" \\"
echo "      -H 'Accept: application/vnd.github+json' \\"
echo "      -H 'Content-Type: application/json' \\"
echo "      -d \"{\\\"name\\\":\\\"\$label\\\",\\\"color\\\":\\\"0075ca\\\"}\""
echo "  done"
