# Sprint 3 GitHub Issues — Status

**Status:** Script written — authentication not available in agent shell; run the script manually.

**Script:** `docs/features/CREATE-ISSUES.sh`

## How to create the issues

```bash
export GITHUB_TOKEN=ghp_your_token_here
bash docs/features/CREATE-ISSUES.sh
```

The script will:
1. Verify authentication
2. Auto-detect the Sprint 3 milestone ID
3. List existing labels and use only ones that exist
4. Create all 6 issues with correct cross-references (blocked-by issue numbers are resolved at runtime)
5. Print a summary table of issue numbers and URLs

## Issues to be created

| Assignee | Title | Priority | Labels |
|----------|-------|----------|--------|
| Tech Lead | `[Tech Lead] Sprint 3 architecture decisions — zoom state model and panel persistence` | P1 | `sprint:3`, `priority:p1` |
| Designer | `[Designer] Arranger zoom — keyboard shortcut research and interaction spec` | P1 | `sprint:3`, `priority:p1` |
| Frontend | `[Frontend] Resizable workspace panels — arranger/mixer splitter + FX panel width` | P1 | `sprint:3`, `component:frontend`, `priority:p1`, `type:feature-request` |
| Frontend | `[Frontend] Arranger horizontal zoom — zoom-aware BAR_W and clip math` | P1 | `sprint:3`, `component:frontend`, `priority:p1`, `type:feature-request` |
| Frontend | `[Frontend] Arranger per-track vertical zoom — zoom-aware TRACK_H` | P2 | `sprint:3`, `component:frontend`, `priority:p2`, `type:feature-request` |
| UAT | `[UAT] Sprint 3 acceptance testing — resizable panels + zoom` | P1 | `sprint:3`, `priority:p1` |

## Dependency chain

```
[Tech Lead] Architecture decisions (#TBD)
  ├── blocks → [Frontend] Resizable panels (#TBD)
  └── blocks → [Frontend] Horizontal zoom (#TBD)
                   └── blocks → [Frontend] Vertical zoom (#TBD)

[Designer] Zoom interaction spec (#TBD)
  └── blocks → [Frontend] Horizontal zoom (#TBD)

[Frontend] Resizable panels  ─┐
[Frontend] Horizontal zoom   ─┼─ all block → [UAT] Sprint 3 acceptance (#TBD)
[Frontend] Vertical zoom     ─┘
```

## Notes

- Labels `component:tech-lead`, `component:design`, `component:uat` may not exist in the repo — the script applies only confirmed labels and prints a helper command to create missing ones.
- The Milestone ID is resolved at runtime; the script searches for a milestone with "sprint 3" in the title (case-insensitive).
- Issue numbers in "Blocked by" lines are inserted at runtime so cross-references are accurate.
